import React, { useEffect, useState, useCallback } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useHistory } from "react-router";
import { magic } from "../magic";
import Loading from "./Loading";
import TimeSlot from "./TimeSlot";

import { db } from "../firebase";

export default function Dashboard() {
    const [userMetadata, setUserMetadata] = useState();
    const [reminders, setReminders] = useState([]);
    const [medicine, setMedicine] = useState('');
    const [slotNumber, setSlotNumber] = useState('');
    const [slotTime, setSlotTime] = useState('');
    const history = useHistory();
    const collectionRef = db.collection("reminders");

    useEffect(() => {
        // On mount, we check if a user is logged in.
        // If so, we'll retrieve the authenticated user's profile.
        magic.user.isLoggedIn().then(magicIsLoggedIn => {
        if (magicIsLoggedIn) {
            magic.user.getMetadata().then(metaData => {
                setUserMetadata(metaData);
                console.log(metaData);
                collectionRef.doc(metaData.email).onSnapshot(reminderDoc => {
                    if(reminderDoc.exists) {
                        console.log(reminderDoc.data());
                        setMedicine(reminderDoc.data().medicine);
                        setReminders(reminderDoc.data().reminders);
                    }
                });
            });
            
        } else {
            // If no user is logged in, redirect to `/login`
            history.push("/login");
        }
        });
    }, []);

    /**
   * Perform logout action via Magic.
   */
    const logout = useCallback(() => {
        magic.user.logout().then(() => {
            history.push("/login");
        })
    }, [history]);

    const handleReminderUpdate = (reminder, index) => {
        const checkSlotAvailibity = (reminderSlot) => {
            return reminderSlot.slotNumber === reminder.slotNumber
        }
        const prevIndex = reminders.findIndex(checkSlotAvailibity);
        console.log(prevIndex);
        if(prevIndex >= 0 && prevIndex !== index) {
            toast.error('Slot already filled', {
                position: "top-center",
                closeOnClick: true,
                draggable: true,
                progress: undefined,
            });
            return;
        }
        const remindersCopy = reminders;
        remindersCopy[index] = reminder;
        setReminders(remindersCopy);
    }

    const handleNumberChange = (event) => {
        setSlotNumber(event.target.value);
    }

    const handleTimeChange = (event) => {
        setSlotTime(event.target.value);
    }

    const handleMedicineChange = (event) => {
        setMedicine(event.target.value);
    }

    const newSlot = () => {
        const [hour, minute] = slotTime.split(':');
        if(medicine && hour && minute && slotNumber) {
            console.log(hour, minute, slotNumber);
            const filteredReminders = reminders.filter(reminder => reminder.slotNumber === slotNumber);
            if(filteredReminders.length > 0) {
                toast.error('Slot already added', {
                    position: "top-center",
                    closeOnClick: true,
                    draggable: true,
                    progress: undefined,
                });
                return;
            }
            fetch(`https://ratificate.us/ReMedy/getCommand.php?time=${hour}${minute}00&slot=${slotNumber}`, {
                mode: "no-cors",
                headers: {
                    "Content-Type": "application/json"
                }
            })
            .then(response => {
                console.log(response);
                reminders.push({
                    slotNumber: slotNumber,
                    time: slotTime
                });
                collectionRef.doc(userMetadata.email).set({
                    medicine, reminders
                })
                .then(() => {
                    console.log("Firebase insertion done");
                    setSlotTime('');
                    setSlotNumber('');
                })
                .catch((error) => {
                    console.error("Error writing document: ", error);
                    toast.error('Something went wrong', {
                        position: "top-center",
                        closeOnClick: true,
                        draggable: true,
                        progress: undefined,
                    });
                });
            }).catch(err => {
                console.error(err);
                toast.error('Something went wrong', {
                    position: "top-center",
                    closeOnClick: true,
                    draggable: true,
                    progress: undefined,
                });
            })
        } else {
            toast.error('Please enter the medicine name and other details', {
                position: "top-center",
                closeOnClick: true,
                draggable: true,
                progress: undefined,
            });
        }
    }

    const addReminder = async (event) => {
        event.preventDefault();
        if(medicine) {
            reminders.forEach(async (reminder, index) => {
                const checkSlotAvailibity = (reminderSlot) => {
                    return reminderSlot.slotNumber === reminder.slotNumber
                }
                console.log(reminder);
                const prevIndex = reminders.findIndex(checkSlotAvailibity);
                console.log(prevIndex);
                if(prevIndex >= 0 && prevIndex !== index) {
                    toast.error(`Slot repeated for reminder at ${index+1} position`, {
                        position: "top-center",
                        closeOnClick: true,
                        draggable: true,
                        progress: undefined,
                    });
                    return;
                }
                console.log(reminder);
                const [hour, minute] = reminder.time.split(':');
                await fetch(`https://ratificate.us/ReMedy/getCommand.php?time=${hour}${minute}00&slot=${reminder.slotNumber}`, {
                    mode: "no-cors",
                    headers: {
                        "Content-Type": "application/json"
                    }
                })
            });
            const [hour, minute] = slotTime.split(':');
            if(hour && minute && slotNumber) {
                const filteredReminders = reminders.filter(reminder => reminder.slotNumber === slotNumber);
                if(filteredReminders.length > 0) {
                    toast.error('Slot already added', {
                        position: "top-center",
                        closeOnClick: true,
                        draggable: true,
                        progress: undefined,
                    });
                    return;
                }
                await fetch(`https://ratificate.us/ReMedy/getCommand.php?time=${hour}${minute}00&slot=${slotNumber}`, {
                    mode: "no-cors",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                reminders.push({
                    slotNumber: slotNumber,
                    time: slotTime
                });
            }
            

            collectionRef.doc(userMetadata.email).set({
                medicine, reminders
            })
            .then(() => {
                console.log("Firebase insertion done");
                setSlotTime('');
                setSlotNumber('');
                toast.success('Reminders updated', {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            })
            .catch((error) => {
                console.error("Error writing document: ", error);
                toast.error('Something went wrong', {
                    position: "top-center",
                    closeOnClick: true,
                    draggable: true,
                    progress: undefined,
                });
            });
        } else {
            toast.error('Please enter the medicine name', {
                position: "top-center",
                closeOnClick: true,
                draggable: true,
                progress: undefined,
            });
        }
    }

    return userMetadata ? <div className="login-clean">
        <ToastContainer
            position="top-center"
            autoClose={10000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
        />
        <form className="dashForm">
            <div className="illustration">
                <i className="icon ion-ios-alarm"></i>
            </div>
            <div className="mb-3">
                <span className="input-group-text med-input-group mb-3">
                    <i className="fa fa-medkit"></i>
                    <input className="form-control med-name" type="text" name="medName" placeholder="Name of Medicine" required="" value={medicine} onChange={handleMedicineChange} />
                </span>
                {reminders.map((reminder, index) => (
                    <TimeSlot key={index} slot={{number: reminder.slotNumber, time: reminder.time}} handleReminderUpdate={handleReminderUpdate} index={index} />
                ))}
                <span className="input-group-text med-input-group mb-3">
                    <input className="form-control med-name" type="number" name="slotNumber" placeholder="Slot Number" required="" value={slotNumber} onChange={handleNumberChange} />
                </span>
                <span id="slot" className="input-group-text time med-input-group">
                    <i className="icon ion-ios-alarm"></i>
                    <input className="form-control med-time" type="time" required="" value={slotTime} onChange={handleTimeChange} />
                </span>
            </div>
            <div className="input-group mb-3">
                <div className="input-group-prepend"></div>
            </div>
            <div className="mb-3" id="container"></div>
            <button onClick={newSlot}
                className="btn btn-outline-primary text-truncate float-none float-sm-none add-another-btn"
                data-bss-hover-animate="pulse" type="button" disabled={!slotNumber || !slotTime}>Add Another Slot
                <i className="fas fa-plus-circle edit-icon"></i>
            </button>
            <div className="mb-3">
                <button onClick={addReminder} className="btn btn-primary d-block w-100" data-bss-hover-animate="tada"  disabled={!medicine}>Add
                    Reminder!</button>
            </div>
        </form>
    </div>: <Loading />;
}

