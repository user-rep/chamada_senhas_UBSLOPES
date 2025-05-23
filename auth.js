const firebaseConfig = {
  apiKey: "AIzaSyAtN_zO40we4KDaI3AJUNepTTmvG9IHc0g",
  authDomain: "chamadasenhas.firebaseapp.com",
  databaseURL: "https://chamadasenhas-default-rtdb.firebaseio.com",
  projectId: "chamadasenhas",
  storageBucket: "chamadasenhas.appspot.com",
  messagingSenderId: "873539549847",
  appId: "1:873539549847:web:500372c75b92b5de0487d2"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

function login() {
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  auth.signInWithEmailAndPassword(email, senha)
    .then(() => window.location.href = 'index.html')
    .catch(e => alert(e.message));
}

function registrar() {
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  auth.createUserWithEmailAndPassword(email, senha)
    .then(() => alert('Registrado!'))
    .catch(e => alert(e.message));
}
