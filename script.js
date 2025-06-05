// SCRIPT.JS COMPLETO COM HOVER ATIVO (HISTÓRICO SINCRONIZADO)

const historicoChamadas = [];

const contadorLocal = {
  normal: 0,
  preferencial: 0
};

let ultimaSenhaFirebase = null;

firebase.database().ref('ultimaSenha').on('value', (snapshot) => {
  const ultima = snapshot.val();
  if (!ultima) return;

  ultimaSenhaFirebase = ultima.texto;

  if (ultima.tipo === 'normal') {
    atualizarUltimaSenhaNormal(ultima.texto);
  } else {
    atualizarUltimaSenhaPreferencial(ultima.texto);
  }

  setTimeout(() => {
    centralizarBotao(ultima.texto);
  }, 100);
});

firebase.database().ref('senhasChamadas').on('value', (snapshot) => {
  const estado = snapshot.val();
  if (!estado) return;

  for (let idColuna in estado) {
    const limite = estado[idColuna];
    aplicarHoverHistorico(idColuna, limite);
  }
});

function aplicarHoverHistorico(idColuna, limite) {
  const coluna = document.getElementById(idColuna);
  if (!coluna) return;

  const botoes = coluna.querySelectorAll('button');

  botoes.forEach(btn => {
    const match = btn.textContent.match(/Senha (\d+)/);
    if (!match) return;

    const num = parseInt(match[1], 10);
    if (num <= limite) {
      btn.classList.add('hover-ativo');
    } else {
      btn.classList.remove('hover-ativo');
    }
  });

  const colunaSincronizadaID = obterColunaSincronizada(idColuna);
  if (colunaSincronizadaID) {
    aplicarHoverHistorico(colunaSincronizadaID, limite);
  }
}

function centralizarBotao(textoSenha) {
  const match = textoSenha.match(/Senha (\d+)/);
  if (!match) return;

  const numero = parseInt(match[1], 10);
  const colunas = [
    'coluna-normal-guiche1', 'coluna-normal-guiche2',
    'coluna-preferencial-guiche1', 'coluna-preferencial-guiche2',
    'coluna-normal-posconsulta', 'coluna-preferencial-posconsulta'
  ];

  for (const idColuna of colunas) {
    const coluna = document.getElementById(idColuna);
    if (!coluna) continue;

    const botoes = Array.from(coluna.querySelectorAll('button'));
    for (const btn of botoes) {
      if (btn.textContent.includes(textoSenha)) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
  }
}

function criarBotao(idColuna, texto, classe) {
  const coluna = document.getElementById(idColuna);
  const botao = document.createElement('button');
  botao.textContent = texto;
  botao.className = classe;

  const isPreferencial = idColuna.includes("preferencial");
  const numeroSenha = parseInt(texto.match(/Senha (\d+)/)[1], 10);
  const destino = texto.split(" - ")[1];
  const textoFalado = isPreferencial
    ? `Senha ${numeroSenha}, preferencial, ${destino}`
    : `Senha ${numeroSenha}, normal, ${destino}`;

  botao.onclick = () => {
    falar(textoFalado);

    const agora = new Date();
    historicoChamadas.push({
      tipo: isPreferencial ? "Senha Preferencial" : "Senha Normal",
      senha: texto,
      guiche: destino,
      data: agora.toLocaleDateString('pt-BR'),
      hora: agora.toLocaleTimeString('pt-BR'),
    });

    firebase.database().ref('ultimaSenha').set({
      tipo: isPreferencial ? "preferencial" : "normal",
      texto: texto
    });

    firebase.database().ref('senhasChamadas/' + idColuna).set(numeroSenha);

    if (botao.textContent === ultimaSenhaFirebase) {
      botao.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  coluna.appendChild(botao);
}

function obterColunaSincronizada(idColuna) {
  if (idColuna === 'coluna-normal-guiche1') return 'coluna-normal-guiche2';
  if (idColuna === 'coluna-normal-guiche2') return 'coluna-normal-guiche1';
  if (idColuna === 'coluna-preferencial-guiche1') return 'coluna-preferencial-guiche2';
  if (idColuna === 'coluna-preferencial-guiche2') return 'coluna-preferencial-guiche1';
  return null;
}

for (let i = 1; i <= 999; i++) {
  const numero = i.toString().padStart(1, '0');
  criarBotao("coluna-normal-guiche1", `Senha ${numero} - Guichê 1`, 'botao-preto');
  criarBotao("coluna-normal-guiche2", `Senha ${numero} - Guichê 2`, 'botao-preto');
  criarBotao("coluna-normal-posconsulta", `Senha ${numero} - Pós Consulta`, 'botao-preto');

  criarBotao("coluna-preferencial-guiche1", `Senha ${numero} - Guichê 1`, 'botao-vermelho');
  criarBotao("coluna-preferencial-guiche2", `Senha ${numero} - Guichê 2`, 'botao-vermelho');
  criarBotao("coluna-preferencial-posconsulta", `Senha ${numero} - Pós Consulta`, 'botao-vermelho');
}

function falar(texto) {
  const synth = window.speechSynthesis;
  const msg = new SpeechSynthesisUtterance();
  msg.text = texto;
  msg.lang = 'pt-BR';
  msg.rate = 1.2;

  const vozSelecionada = document.getElementById("vozSelecionada")?.value;
  const vozes = synth.getVoices();
  const voz = vozes.find(v => v.name === vozSelecionada);
  if (voz) msg.voice = voz;

  synth.speak(msg);
}

async function chamarSenhaSincronizada(tipo, guiche) {
  const ref = firebase.database().ref(tipo === 'normal' ? 'contadorNormal' : 'contadorPreferencial');
  const snapshot = await ref.get();
  let contador = snapshot.exists() ? snapshot.val() : 0;
  contador++;
  await ref.set(contador);

  const idColuna = tipo === 'normal'
    ? (guiche === 1 ? 'coluna-normal-guiche1' : 'coluna-normal-guiche2')
    : (guiche === 1 ? 'coluna-preferencial-guiche1' : 'coluna-preferencial-guiche2');

  const coluna = document.getElementById(idColuna);
  const botoes = Array.from(coluna.querySelectorAll('button'));
  const botao = botoes.find(b => b.textContent.includes(`Senha ${contador} -`));

  if (botao) {
    botao.click();
  }
}

document.addEventListener("keydown", function (event) {
  const tecla = event.key.toLowerCase();
  const inputNome = document.getElementById("nomePessoa");

  if (document.activeElement === inputNome) return;

  if (tecla === 'n') {
    esperarSegundoKey('n');
  } else if (tecla === 'p') {
    esperarSegundoKey('p');
  }
});

function esperarSegundoKey(tipo) {
  function segundaLetra(e) {
    const k = e.key;

    if (tipo === 'n') {
      if (k === '1') chamarSenhaSincronizada('normal', 1);
      else if (k === '2') chamarSenhaSincronizada('normal', 2);
    } else if (tipo === 'p') {
      if (k === '1') chamarSenhaSincronizada('preferencial', 1);
      else if (k === '2') chamarSenhaSincronizada('preferencial', 2);
    }

    document.removeEventListener('keydown', segundaLetra);
  }

  document.addEventListener('keydown', segundaLetra);
}

window.speechSynthesis.onvoiceschanged = () => {
  falar('');
};

document.addEventListener("DOMContentLoaded", function () {
  // Outros inits podem ser adicionados aqui
});
