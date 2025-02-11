import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import Services from "./components/Services";
import Login from "./components/Login";
import Admin from "./components/Roles/Admin";
import AdminNavbar from "./components/Role Components/AdminNavbar";
import CreateUser from "./components/Role Components/Admin/CreateUser";
import DeleteUser from "./components/Role Components/Admin/DeleteUser";
import TeacherNavbar from "./components/Role Components/TeacherNavbar";
import Teacher from "./components/Roles/Teacher";
import AddAssignment2 from "./components/Role Components/Teacher/AddAssignment2";
import Student from "./components/Roles/Student";
import StartAssignment from "./components/Role Components/Student/StartAssignment";
import StartTest from "./components/Role Components/Student/StartTest";
import FindAssignment from "./components/Role Components/Teacher/FindAssignment";
import AllAssignments from "./components/Role Components/Teacher/AllAssignments";
import Evaluation from "./components/Role Components/Teacher/Evaluation";
import StudentHomePage from "./components/Roles/StudentHomePage";
import Performance from "./components/Role Components/Student/Performance";


function App() {
  return (
    <Router>

      <Routes>
        <Route path="/home" element={<><Navbar /> <HomePage />  <Services /> </>} />
        <Route path="/services" element={<><Navbar /> <Services /></>} />
        <Route path="/login" element={<><Navbar /><Login /></>} />
        <Route path="/schooler/admin/home" element={<><AdminNavbar /><Admin /></>}></Route>
        <Route path="/schooler/admin/createUser" element={<><AdminNavbar /><CreateUser /></>}></Route>
        <Route path="/schooler/admin/deleteUser" element={<><AdminNavbar /><DeleteUser /></>}></Route>
        <Route path="/schooler/teacher/home" element={<><TeacherNavbar /><Teacher /></>}></Route>
        <Route path="/schooler/teacher/addAssignment" element={<AddAssignment2 />}></Route>
        <Route path="/schooler/student/home" element={<><AdminNavbar /><StudentHomePage /></>}></Route>
        <Route path="/schooler/student/viewAssignments" element={<><AdminNavbar /><Student/></>}></Route>
        <Route path="/schooler/student/performance" element={<><AdminNavbar /><Performance></Performance></>}></Route>
        <Route path="/schooler/student/assignment/:id" element={<> <StartAssignment/></>} />
        <Route path="/schooler/student/assignment/start/:id" element={<> <StartTest/></>} />
        <Route path="/schooler/teacher/allAssignments/evaluation/showAllAssignments/:id" element={<><FindAssignment/></>} />

        <Route path="/schooler/teacher/allAssignments" element={<><AllAssignments/></>}></Route>
        <Route path="/schooler/teacher/evaluation/:testId/:assignmentId/:studentId" element={<><Evaluation/></>}></Route>
      
      
      
      </Routes>
    </Router>
  );
}

export default App;
