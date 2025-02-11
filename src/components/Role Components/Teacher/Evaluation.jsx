import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function Evaluation() {
  const navigate = useNavigate();
  const { testId, assignmentId, studentId } = useParams();

  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [scores, setScores] = useState({}); // Store individual question scores
  const [totalScore, setTotalScore] = useState(0); // Store total score

  // Fetch test data
  async function fetchTestData() {
    let response = await fetch(
      `http://localhost:3000/schooler/teacher/getTestData?testId=${testId}&assignmentId=${assignmentId}&studentId=${studentId}`
    );
    if (!response.ok) {
      throw new Error('ERROR');
    }
    let data = await response.json();
    setTestData(data.response.testData);
    setQuestions(data.response.questions);
    setAnswers(data.response.answers);
  }

  useEffect(() => {
    fetchTestData();
  }, [testId]);

  // Handle input changes for scores
  const handleScoreChange = (questionId, value) => {
    const updatedScores = { ...scores, [questionId]: parseInt(value) || 0 };
    setScores(updatedScores);

    // Recalculate total score
    const newTotalScore = Object.values(updatedScores).reduce((sum, score) => sum + score, 0);
    setTotalScore(newTotalScore);
  };

  // Handle Ask AI button click
  const handleAskAI = async (questionId, questionText, answerText, maxScore) => {
    try {
      const response = await fetch('http://localhost:3000/schooler/teacher/aievaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: questionText,
          answer: answerText,
          maxScore: maxScore
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch evaluation from DeepSeek API');
      }
  
      const data = await response.json();
      const aiScore = data.score; // Assuming the API returns a `score` field
      handleScoreChange(questionId, aiScore);
    } catch (error) {
      console.error('Error calling DeepSeek API:', error);
      alert('Failed to evaluate the answer. Please try again.');
    }
  };

  // Handle submit button
  const handleSubmit = () => {
    // Send totalScore to the backend
    fetch('http://localhost:3000/schooler/teacher/submitTotalScore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ testId, assignmentId, studentId, totalScore }),
    })
      .then((response) => {
        if (response.ok) {
          alert('Evaluation saved successfully');
          navigate('/schooler/teacher/allAssignments');
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        alert('Failed to submit score.');
      });
  };

  return (
    <div>
      {testData ? (
        <div>
          <div className="flex justify-between">
            <div className="h-fit m-6 p-4 bg-gray-200 font-display rounded-lg">
              Assignment Id: {testData[0].assignment_id}
            </div>
            <div className="h-fit m-6 p-4 bg-gray-200 font-display rounded-lg">
              Test Id: {testData[0].id}
            </div>
            <div className="h-fit m-6 p-4 bg-gray-200 font-display rounded-lg">
              Student Id: {testData[0].student_id}
            </div>
            <div className="h-fit m-6 p-4 bg-gray-200 font-display rounded-lg">
              Tab Switches: {testData[0].tab_switches}
            </div>
          </div>

          {questions.map((e, i) => (
            <div key={e.id} className="p-2 m-2">
              <div className="flex justify-between">
                <div>Question: {e.question}</div>
                <div className="flex gap-4">
                  <input
                    type="number"
                    className="border-2 w-28 text-center"
                    placeholder="Enter Score"
                    name={`score-${e.id}`}
                    value={scores[e.id] || ''}
                    onChange={(event) => handleScoreChange(e.id, event.target.value)}
                  />
                  <button
                    className="hover:text-white hover:bg-black border-2 border-black px-2"
                    onClick={() => handleAskAI(e.id, e.question, answers[i].contents, e.score)}
                  >
                    Ask AI
                  </button>
                </div>
                <div>Max Score: {e.score}</div>
              </div>
              <div>
                Answer:
                <div
                  className="border-2 border-gray-400 p-4"
                  dangerouslySetInnerHTML={{ __html: answers[i].contents }}
                ></div>
              </div>
            </div>
          ))}

          <div className="flex justify-center items-center">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full md:w-1/4 py-2 mt-4 bg-blue-500 text-white rounded"
            >
              Submit
            </button>
          </div>

          <div className="flex justify-center mt-4">
            <p>Total Score: {totalScore}</p>
          </div>
        </div>
      ) : (
        <div className="flex justify-center h-screen items-center">
          <p className="text-3xl">Loading...</p>
        </div>
      )}
    </div>
  );
}

export default Evaluation;