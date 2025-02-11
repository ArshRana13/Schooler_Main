import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import JoditEditor from 'jodit-react';

async function fetchQuestions(id) {
    let response = await fetch(`http://localhost:3000/schooler/student/getQuestions?id=${id}`);
    let data = await response.json();
    return data;
}

function StartTest() {
    const [studentId, setStudentId] = useState(0);
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
                    if (data.role === 'student') {
                        console.log("data is ", data);
                        setStudentId(data.student_id);
                        setAuthenticated(true);
                    } else {
                        navigate('/login');
                    }
                } else {
                    console.log(response);
                }
            } catch (error) {
                console.error('Fetch error:', error);
                navigate('/login');
            }
        };

        checkAuth();
    }, [navigate]);

    const [title, setTitle] = useState('');
    const [assignmentId, setAssignmentId] = useState(0);
    const [hours, setHours] = useState(0);
    const [mins, setMins] = useState(0);
    const [secs, setSecs] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [responses, setResponses] = useState([]);
    const [tabSwitches, setTabSwitches] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(true);
    const [showFullScreenPrompt, setShowFullScreenPrompt] = useState(false);
    const [testSubmitted, setTestSubmitted] = useState(false);
    const submittedRef = useRef(false); // Use a ref to track submission
    let { id } = useParams();

    useEffect(() => {
        async function getQuestions() {
            try {
                let details = await fetchQuestions(id);
                setTitle(details.data.title);
                setHours(details.data.timeLimit.hours);
                setMins(details.data.timeLimit.mins);
                setSecs(details.data.timeLimit.secs);
                setQuestions(details.data.questions);
                setResponses(new Array(details.data.questions.length).fill(''));
                setAssignmentId(details.data.questions[0].assignment_id);
            } catch (error) {
                console.error("Failed to fetch assignment details", error);
            }
        }

        getQuestions();

        // Automatically request full-screen when the page loads
        document.documentElement.requestFullscreen().catch((err) => {
            console.error("Full-screen mode could not be activated", err);
        });
    }, [id]);

    const submitTest = async () => {
        if (submittedRef.current) return; // Prevent duplicate submissions
        submittedRef.current = true; // Mark as submitted
        setTestSubmitted(true);

        let obj = { "answers": responses, "assignmentId": assignmentId, "questions": questions, "tabSwitches": tabSwitches, "studentId": studentId };
        let response = await fetch(`http://localhost:3000/schooler/student/submitTest`, {
            headers: { "content-type": "application/json" },
            body: JSON.stringify(obj),
            method: "post"
        });

        if (response.ok) {
            navigate('/schooler/student/home');
        }
        console.log("submitted");
    };

    useEffect(() => {
        console.log(responses);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                setTabSwitches((prev) => prev + 1);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        let timer;

        const tick = () => {
            if (submittedRef.current) {
                clearTimeout(timer);
                return;
            }

            setSecs((prevSecs) => {
                if (prevSecs > 0) return prevSecs - 1;
                if (mins > 0) {
                    setMins(mins - 1);
                    return 59;
                }
                if (hours > 0) {
                    setHours(hours - 1);
                    setMins(59);
                    return 59;
                }
                if (prevSecs === 0 && hours === 0 && mins === 0 && !submittedRef.current) {
                    submitTest(); // Submit the test only once
                }
                return 0;
            });

            timer = setTimeout(tick, 1000);
        };

        timer = setTimeout(tick, 1000);

        return () => clearTimeout(timer);
    }, [secs, mins, hours]);

    useEffect(() => {
        const handleFullScreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullScreen(false);
                setShowFullScreenPrompt(true); // Show prompt if full-screen is exited
            } else {
                setIsFullScreen(true);
                setShowFullScreenPrompt(false); // Hide prompt once back in full-screen
            }
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, []);

    const handleReturnToFullScreen = () => {
        document.documentElement.requestFullscreen().catch((err) => {
            console.error("Failed to return to full-screen mode", err);
        });
    };

    const handleAnswerChange = (index, content) => {
        setResponses((prev) => {
            const newResponses = [...prev];
            newResponses[index] = content;
            return newResponses;
        });
    };

    const config = useMemo(() => ({
        readonly: false,
        placeholder: 'Start typing...',
    }), []);

    return (
        <div>
            {showFullScreenPrompt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col justify-center items-center">
                        <h2 className="text-lg font-bold mb-4">Please return to full-screen mode to continue the test</h2>
                        <button onClick={handleReturnToFullScreen} className="bg-blue-500 text-white px-4 py-2 rounded">
                            Return to Full-Screen
                        </button>
                    </div>
                </div>
            )}

            <div className={showFullScreenPrompt ? 'blur-sm pointer-events-none' : ''}>
                <div className="flex justify-between m-4">
                    <div className="h-fit m-6 p-4 bg-gray-200 font-display rounded-lg">
                        Tab Switched: {tabSwitches}
                    </div>
                    <div className="h-fit m-6 p-4 bg-gray-200 font-display rounded-lg">
                        Time remaining: {`${hours}:${mins}:${secs < 10 ? `0${secs}` : secs}`}
                    </div>
                </div>

                <div className="questions">
                    {questions.map((q, index) => (
                        <div key={index} className="m-4 p-4 border rounded">
                            <div className='flex justify-between'><h3 className="font-bold">{q.question}</h3> <h3>Score: {q.score}</h3></div>
                            <JoditEditor
                                value={responses[index]}
                                config={config}
                                tabIndex={1}
                                onBlur={(newContent) => handleAnswerChange(index, newContent)}
                            />
                        </div>
                    ))}
                </div>

                <div className='flex justify-center items-center'>
                    <button className='bg-blue-500 text-white px-4 py-2 rounded' onClick={submitTest}>Submit test</button>
                </div>
            </div>
        </div>
    );
}

export default StartTest;