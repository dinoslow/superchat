import React, { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { v4 as uuidv4 } from 'uuid';
import * as Yup from 'yup';
import './App.css';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore'

firebase.initializeApp({
  apiKey: "AIzaSyBpcHYXRN3_ot3q3esTfkrxK40OLfekKnA",
  authDomain: "superchat-17177.firebaseapp.com",
  projectId: "superchat-17177",
  storageBucket: "superchat-17177.appspot.com",
  messagingSenderId: "209866250487",
  appId: "1:209866250487:web:33f675440271b2d6075bf2",
  measurementId: "G-401WX6NRQK"
})

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
  const [user] = useAuthState(auth);
  const roomRef = firestore.collection('rooms');
  // const query = firestore.collection('userInformation');
  // const [friends, loading, error] = useCollectionData(query, {idField: "id"});

  const [enter, setEnter] = useState(false); 
  const [name, setName] = useState(""); 
  const [num, setNum] = useState(2);

  const room2 = useRef(0);
  const room3 = useRef(0);
  const room5 = useRef(0);

  const Id2 = useRef(0);
  const Id3 = useRef(0);
  const Id5 = useRef(0);

  const roomId = useRef("");

  roomRef.doc("room2").get().then((doc) => {
    room2.current = doc.data().people;
    Id2.current = doc.data().roomId;
  });

  const handleEnter = async (name, number) => {
    await setName(name);
    await setNum(number);
    await handleRoom(number);
    await setEnter(true);
  }

  const handleLeave = async () => {
    await setEnter(false);
  }

  const handleRoom = async (number) => {
    if(number === 2) {
      await roomRef.doc("room2").get().then((doc) => {
        room2.current = doc.data().people;
        Id2.current = doc.data().roomId;
      });
      if(room2.current === 2) {
        room2.current = 1;
        Id2.current = uuidv4();
        roomId.current = Id2.current;
        roomRef.doc('room2').update({
          people: 1,
          roomId: Id2.current,
        })
      }
      else {
        room2.current += 1;
        roomId.current = Id2.current;
        await roomRef.doc('room2').update({
          people: room2.current,
        })
      }
    }
  }

  return (
    <div className="App">
      <header>
        {user && !enter && <SignOut />}
        {user && enter && <Leave handleLeave={handleLeave} />}
      </header>
      <section>
        {!user && <SignIn />}
        {user && !enter && <Lobby handleEnter={handleEnter} />}
        {user && enter && <ChatRoom name={name} roomId={roomId.current}/>}
      </section>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  };
  return (
    <button onClick={signInWithGoogle}>Sign in with Google</button>
  );
};

function SignOut() {
  return auth.currentUser && (
    <button onClick={() => auth.signOut()}>Sign Out</button>
  )
}

function Leave(props) {
  const leave = () => {
    props.handleLeave();
  }
  return (
    <button onClick={leave}>Leave</button>
  );
}

function Lobby(props) {
  const nickname = useRef("");
  const number = useRef(2); 

  const handleEnter = (values) => {
    nickname.current = values.name;
    number.current = values.number;
    props.handleEnter(nickname.current, number.current);
  }

  return (
    <div className="Lobby">
      <h1>= Let's talk to other people =</h1>
      <Formik
        initialValues={{name: "", number: 2}}
        validationSchema={Yup.object({
          name: Yup.string().required(''),
        })}
        onSubmit={values => handleEnter(values)}
      >
        <Form>
          <label htmlFor="name">Your Name</label>
          <Field name="name" type="text" autoComplete="off"/>
          <ErrorMessage name="name" />

          <label htmlFor="number">people amount</label>
          <Field  name="number" as="select">
            <option value="2">2</option>
            {/* <option value="3">3</option>
            <option value="5">5</option> */}
          </Field>

          <button type="submit">Enter</button>
        </Form>
      </Formik>
    </div>
  )
}

function ChatRoom ({name, roomId}) {
  const dummy = useRef();
  const { uid, email, displayName } = auth.currentUser;
  const messageRef = firestore.collection(`messages-${roomId}`);
  const userInformationRef = firestore.collection('userInformation').doc(`${uid}`);
  const query = messageRef.orderBy('createdAt');

  const [message] = useCollectionData(query, {idField: 'id'});
  const [formValue, setFormValue] = useState('');

  useEffect(async () => {
    await userInformationRef.set({
      userId: uid,
      userEmail: email,
      name: displayName,
    });
  }, []);

  const sendMessage = async(e) => {
    e.preventDefault();
    if(formValue === "") return;
    const { uid, photoURL } = auth.currentUser;

    await messageRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
    });

    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <main>
        <div>
          {message && message.map(msg => <ChatMessage key={msg.id} message={msg} />)}
        </div>

        <div ref={dummy}></div>
      </main>
      <form onSubmit={sendMessage}>
        <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="What's on your mind"/>
        <button type="submit">🕊️</button>
      </form>
    </>
  );
}

function ChatMessage(props) {
  const {text, uid, photoURL} = props.message;

  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (
    <div className={`message ${messageClass}`}>
      <img alt="user" src={photoURL}/>
      <p>{text}</p>
    </div>
  
  );
}

export default App;
