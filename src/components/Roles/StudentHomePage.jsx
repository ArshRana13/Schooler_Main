import React, { useEffect, useState } from 'react';
import { useNavigate, Link} from 'react-router-dom';
import studentImage from '../../assets/study.png';

function StudentHomePage() {

    // function startAssignmentPage(id)
    // {
    //     console.log("assignment id ",id);
    //     navigate(`/schooler/student/assignment/${id}`);
    // }


    const [authenticated, setAuthenticated] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('http://localhost:3000/schooler/home', {
                    credentials: 'include'  // Include credentials for CORS
                });

                if (response.ok) {
                    const data = await response.json();
                    //console.log(data);
                    
                    if (data.role === 'student') {
                       
                        setAuthenticated(true);
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

 

    return (
        <div>
            {authenticated ? (
                <div className='flex m-6 p-4 flex-col items-center justify-center'>
                    <img className='max-h-60 max-w-60' src={studentImage} alt="Student" />
                    <span className='m-8 text-2xl text-center'>Welcome to Students page!</span>
                    
                    <div className='flex p-8 m-8 gap-8'>
                        <Link to='/schooler/student/viewAssignments' className='text-lg border-2 border-black p-2 text-center font-medium hover:bg-black hover:text-white'>👀View Assignments</Link>
                        <Link to='/schooler/student/performance' className='text-lg border-2 border-black p-2 text-center font-medium hover:bg-black hover:text-white'>📈Performance</Link>
                        {/* <Link to='' className='text-lg border-2 border-black p-2 text-center font-medium hover:bg-black hover:text-white'>➕Create Assignment</Link> */}
                         
                    </div>
                    
                </div>
            ) : (
                <div>Checking authentication...</div>
            )}
        </div>
    );
}

export default StudentHomePage;
