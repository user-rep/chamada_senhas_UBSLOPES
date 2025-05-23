// Inicialização do Firebase
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
const db = firebase.database();

// Função de voz
function falar(texto) {
  const synth = window.speechSynthesis;
  const msg = new SpeechSynthesisUtterance();
  msg.text = texto;
  msg.lang = 'pt-BR';
  msg.rate = 0.9;

  const vozSelecionada = document.getElementById("vozSelecionada")?.value;
  const vozes = synth.getVoices();
  const voz = vozes.find(v => v.name === vozSelecionada);
  if (voz) msg.voice = voz;

  synth.speak(msg);
}

// Atualização das últimas senhas
function atualizarUltimaSenhaNormal(texto) {
  const div = document.getElementById('senha-normal');
  if (div) div.textContent = texto;
}

function atualizarUltimaSenhaPreferencial(texto) {
  const div = document.getElementById('senha-preferencial');
  if (div) div.textContent = texto;
}

// Chamada para Guichê 1 ou 2 (sincronizada)
function chamarProximaSenhaGuiche(tipo) {
  const tipoSenha = tipo === 'N' ? 'normal' : 'preferencial';
  
  db.ref('senhas/' + tipoSenha).transaction(numero => (numero || 0) + 1)
    .then(result => {
      const numero = result.snapshot.val();
      const destino = document.getElementById("check-guiche1").checked ? "Guichê 1" : "Guichê 2";
      const textoFalado = `Senha ${numero}, ${tipoSenha}, ${destino}`;
      
      if (tipoSenha === 'normal') {
        atualizarUltimaSenhaNormal(`Senha ${numero} - ${destino}`);
      } else {
        atualizarUltimaSenhaPreferencial(`Senha ${numero} - ${destino}`);
      }
      falar(textoFalado);
    });
}

// Chamada para Pós Consulta (independente)
function chamarProximaSenhaPosConsulta(tipo) {
  const tipoSenha = tipo === 'CN' ? 'normal' : 'preferencial';

  db.ref(`senhas/posconsulta/${tipoSenha}`).transaction(numero => (numero || 0) + 1)
    .then(result => {
      const numero = result.snapshot.val();
      const textoFalado = `Senha ${numero}, ${tipoSenha}, Pós Consulta`;
      
      if (tipoSenha === 'normal') {
        atualizarUltimaSenhaNormal(`Senha ${numero} - Pós Consulta`);
      } else {
        atualizarUltimaSenhaPreferencial(`Senha ${numero} - Pós Consulta`);
      }
      falar(textoFalado);
    });
}

// Atalhos de teclado
document.addEventListener("keydown", function(event) {
  const tecla = event.key.toLowerCase();
  const inputNome = document.getElementById("nomePessoa");
  
  if (document.activeElement === inputNome) return;

  if (tecla === 'n') {
    chamarProximaSenhaGuiche('N');
  } else if (tecla === 'p') {
    chamarProximaSenhaGuiche('P');
  } else if (tecla === 'c') {
    document.addEventListener("keyup", function escutador(e) {
      if (e.key.toLowerCase() === 'n') {
        chamarProximaSenhaPosConsulta('CN');
      } else if (e.key.toLowerCase() === 'p') {
        chamarProximaSenhaPosConsulta('CP');
      }
      document.removeEventListener("keyup", escutador);
    }, { once: true });
  }
});

// Sincronização visual das senhas em tempo real
db.ref('senhas').on('value', snapshot => {
  const senhas = snapshot.val() || { normal: 0, preferencial: 0, posconsulta: { normal: 0, preferencial: 0 } };

  atualizarUltimaSenhaNormal(`Senha ${senhas.normal} - Guichê`);
  atualizarUltimaSenhaPreferencial(`Senha ${senhas.preferencial} - Guichê`);
});

db.ref('senhas/posconsulta').on('value', snapshot => {
  const pos = snapshot.val() || { normal: 0, preferencial: 0 };

  atualizarUltimaSenhaNormal(`Senha ${pos.normal} - Pós Consulta`);
  atualizarUltimaSenhaPreferencial(`Senha ${pos.preferencial} - Pós Consulta`);
});
