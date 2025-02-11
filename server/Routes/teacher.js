// importing 
import express, { query } from 'express';
import dotenv from 'dotenv';
import pg from 'pg';
import { broadcast } from '../server.js';
import cors from 'cors';
import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";
// const axios = require('axios');
dotenv.config();


const gemini_api_key = process.env.API_KEY;
const googleAI = new GoogleGenerativeAI("AIzaSyAs57c--TlMKJvPDzOIgGLhzib7zicxWA4");
const geminiConfig = {
  temperature: 0.9,
  topP: 1,
  topK: 1,
  maxOutputTokens: 4096,
};
 
const geminiModel = googleAI.getGenerativeModel({
  model: "gemini-pro",
  geminiConfig,
});

const router = express.Router();

// Database connection
const db = new pg.Client({
  password: process.env.DATABASE_PASSWORD,
  host: 'localhost',
  user: 'postgres',
  database: 'schooler',
  port: 5432
});
db.connect();

router.post('/addAssignment',async (req,res)=>{
 //console.log(req.body);

  let {group,title,description,inputFields,hours,minutes,seconds,deadline, totalScore} = req.body;


  //console.log("deadline  :  ",deadline);
  try{
    let a =  await db.query(
      'INSERT INTO assignmentss(group_name,title,description,time_limit_hours,time_limit_minutes,time_limit_seconds,deadline, totalscore) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
       [group,title,description,hours,minutes,seconds,deadline,totalScore]);
       
       const result = await db.query('SELECT * FROM assignmentss');
       const assignments = result.rows;
       broadcast({ type: 'UPDATE_ASSIGNMENTS', assignments });
       

      let id = a.rows[0].id;
       //now i will insert questions in the database
       inputFields.forEach( async (element) => {
        let question = element.value;
        let score = element.score;

       await db.query(
        'Insert into questions(question,score,assignment_id) Values($1, $2, $3)',
        [question,score,id]
      );
       });
    }
  catch(e){
    console.log('Error occured while creating the assignment');
    console.log(e);
  }
  res.send('hello');
  // let {group,title,description,score,message}= req.body;
  // try{
  // await db.query('INSERT INTO assignments (group_student,title,description,score) VALUES ($1, $2, $3, $4)', [group,title,description,score])
  // const result = await db.query('SELECT title, description, score FROM assignments');
  // const assignments = result.rows;
  // broadcast({ type: 'UPDATE_ASSIGNMENTS', assignments });
  // res.sendStatus(200);
  // }
  // catch(error){
  //   console.error('Error creating assignment:', error);
  //   res.status(500).json({ message: 'Assignment creation failed' });
  // }
})
export default router;


router.get('/getTests',async (req,res) =>{
  let id = req.query.id;
  //console.log('id is ',id);
  try{
    let result = await db.query('SELECT * FROM tests WHERE assignment_id = $1 AND evaluated = false', [id]);
    if(result.rows.length > 0)
    {
      res.send({tests: result.rows});
    }
    else{
      res.send({msg:"empty"})
    }
  }
  catch(e){
    console.log('error in tests ',e);
    
  }
  
})


//evaluation
router.get('/getTestData', async (req,res) =>{
  let {testId, assignmentId, studentId} = req.query;
  //console.log(req.query);
  
  
  try{
    let result = await db.query("SELECT * FROM tests WHERE id = $1 AND assignment_id = $2 AND student_id = $3",[testId, assignmentId, studentId]);
    //console.log(result.rows);
    
    if(result.rows.length == 1)
    {
      //such test exists
      let questions = await db.query("SELECT * FROM questions WHERE assignment_id = $1",[assignmentId]);
      //console.log(questions.rows);
      //now iterate through questions and get their answers and send response
      let answers = [];
      for(let i=0;i<questions.rows.length;i++)
      {
        let answer = await db.query("SELECT * FROM answers WHERE question_id = $1",[questions.rows[i].id]);
        //console.log('answer for this question is XD ',  answer.rows);
        answers.push(answer.rows[0]);
      }
      //console.log(answers);
      let response =
      {
        "testData" : result.rows,
        "questions" : questions.rows,
        "answers" : answers
      };
      res.send({response});
    } 
    else{
      //such test does not exists
      res.send({msg: "error"});
    }
    

  }
  catch(e){
    console.log(e);
    
  }
});

router.all('/submitTotalScore', async(req,res) => {
  console.log(req.body);
  let {testId, assignmentId, studentId, totalScore} = req.body;
  // Now we have to do some things
  // like firstly set evaluated = true
  // then showing numbers to the students
  //  in real time 
  try{
     await db.query('UPDATE tests SET evaluated = $1 WHERE id = $2',[true, testId]);
     await db.query('UPDATE tests SET totalscore = $1 WHERE id = $2',[totalScore, testId]);
     res.sendStatus(200);
  }
  catch(e){
    console.log(e);
    
  }

});

router.get('/getTitle',async (req,res)=>{
  try{
    let assignment = await db.query('Select title from assignmentss where id = $1',[req.query.id])
    res.send({"title":assignment.rows[0].title});
  }
  catch(e)
  {
    console.log('error in assinmentss relation ',e);
    
  }
})
/*
plan for evaluating the assignments 
1. Web sockets so that when the student submits the assignment it is being displaued to the teacher via web sockets.
2. Teacher home page will have two segments => 
      i. create assignments(done)
      ii. Evaluate assignments(to be done)
3. The Evaluate assignment page will have structure like this
    - Each answer will be displayed with the answer submitted by the student.
    = Each question will have the max score next to it and a input box where the teacher will give max obtained by the student.
    - There will also be a AI button that will evaluate the question with the answer provided by the student and will fill the score input box.
    -(summary) => teacher will have control of which question to check manually and which question to be checked by the AI.
    -when the teacher clicks on Submit evaluation the marks are displayed to the student.
    - the ID of the student is not displayed to the teacher. 
*/



router.post('/aievaluate', async (req, res) => {
  console.log('request made');
  const { question, answer, maxScore } = req.body;
  try {
    const prompt = `
        question is ${question}\n
        answer given by the student is ${answer}\n
        max score is ${maxScore}\n
        evaulate this ans in response send only the marks no text
    `;
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    console.log(response.text());
    res.send({score: response.text()});
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate the answer' });
  }
});

