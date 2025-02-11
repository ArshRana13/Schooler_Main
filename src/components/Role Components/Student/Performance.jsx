



import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';


function Performance() {




    const [authenticated, setAuthenticated] = useState(false);
    const [studentId, setStudentId] = useState('');
    const [tests, setTests] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('http://localhost:3000/schooler/home', {
                    credentials: 'include'  // Include credentials for CORS
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.role === 'student') {
                        console.log(data);
                        
                        setStudentId(data.student_id);
                        setAuthenticated(true);
                        console.log("student id ", studentId);

                        
                    } else {
                        navigate('/login');
                    }
                } else {
                    navigate('/login');
                }
            } catch (error) {
                console.error('Fetch error:', error);
                navigate('/login');
            }
        };

        checkAuth();
    }, [navigate]);


    async function getTests() {
        if(studentId != '')
        {
        try{
            let response = await fetch(`http://localhost:3000/schooler/student/getEvaluatedTests?id=${studentId}`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            let data = await response.json();
            console.log("data is ",data);
            setTests(data.response);
            
        }
        catch(e)
        {
            console.log("something went wrong!")
        }
    }
    }

    useEffect(()=>{
        getTests();
    },[studentId]);

    function getGrade(marksObtained, maxMarks) {
        const percentage = (marksObtained / maxMarks) * 100; // Calculate percentage
        
        if (percentage >= 90) return "A+";
        else if (percentage >= 85) return "A";
        else if (percentage >= 80) return "A-";
        else if (percentage >= 75) return "B+";
        else if (percentage >= 70) return "B";
        else if (percentage >= 65) return "C+";
        else if (percentage >= 60) return "C";
        else if (percentage >= 55) return "D+";
        else if (percentage >= 50) return "D";
        else if (percentage >= 40) return "E";
        else return "F"; // For percentages below 40
    }
  
    return (
        <div>
            {authenticated ? (
                <div className='flex m-6 p-4 flex-col items-center justify-center'>
     
                    <span className='m-8 text-4xl text-center'>Evaluated Assignments</span>
                    <table className='min-w-full divide-y text-center divide-gray-200 border'>
                        <thead className='bg-gray-50 text-center'>
                            <tr>
                                <th className='px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider'>Title</th>
                                <th className='px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider'>Your Score</th>
                                <th className='px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider'>Max Score</th>
                                <th className='px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider'>Grade</th>
                            </tr>
                        </thead>
                        <tbody className='bg-white divide-y divide-gray-200'>
                            {tests.map((e, index) => (
                                <tr key={index}>
                                    <td className='px-4 py-4 whitespace-nowrap'>{e.title}</td>
                                    <td className='px-4 py-4 whitespace-nowrap'>{e.totalscore}</td>
                                    <td className='px-4 py-4 whitespace-nowrap'>{e.maxscore}</td>
                                    <td className='px-4 py-4 whitespace-nowrap'>{getGrade(e.totalscore, e.maxscore)}</td>
                                    
                                    
                                    
                                    
                                    
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div>Checking authentication...</div>
            )}
        </div>
    );

}

export default Performance;
