const historicoChamadas = [];

const contadorLocal = {
  normal: 0,
  preferencial: 0
};

let ultimaSenhaFirebase = null;

// Escuta a última senha chamada e atualiza as telas
firebase.database().ref('ultimaSenha').on('value', (snapshot) => {
  const ultima = snapshot.val();
  if (!ultima) return;

  // Evita reprocessar se a senha não mudou
  if (ultimaSenhaFirebase === ultima.texto) return;
  ultimaSenhaFirebase = ultima.texto;

  if (ultima.tipo === 'normal') {
    atualizarUltimaSenhaNormal(ultima.texto);
  } else {
    atualizarUltimaSenhaPreferencial(ultima.texto);
  }

  // Centraliza o botão correspondente
  setTimeout(() => {
    centralizarBotao(ultima.texto);
  }, 100);
});

function centralizarBotao(textoSenha) {
  const match = textoSenha.match(/Senha (\d+)/);
  if (!match) return;

  const numero = parseInt(match[1], 10);

  // IDs das colunas a procurar
  const colunas = ['coluna-normal-guiche1', 'coluna-normal-guiche2', 'coluna-preferencial-guiche1', 'coluna-preferencial-guiche2'];

  let encontrou = false;

  for (const idColuna of colunas) {
    const coluna = document.getElementById(idColuna);
    if (!coluna) continue;

    const botoes = Array.from(coluna.querySelectorAll('button'));

    for (const btn of botoes) {
      if (btn.textContent.includes(textoSenha)) {
        btn.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        encontrou = true;
        break;
      }
    }

    if (encontrou) break;
  }

  if (!encontrou) {
    // Se ainda não existe o botão (ex: delay no carregamento), tenta novamente
    setTimeout(() => centralizarBotao(textoSenha), 200);
  }
}

function escutarAlteracoesMaioresSenhas() {
  firebase.database().ref('maioresSenhasPorColuna').on('value', snapshot => {
    const estado = snapshot.val();
    if (!estado) return;

    for (let idColuna in estado) {
      const limite = estado[idColuna];
      const isPreferencial = idColuna.includes("preferencial");
      const classeDestaque = isPreferencial ? 'botao-destacado-preferencial' : 'botao-destacado-normal';

      // Atualiza destaque na coluna principal
      atualizarDestaqueColuna(idColuna, limite, classeDestaque);

      // Atualiza destaque na coluna sincronizada (guichê espelho)
      const colunaSincronizadaID = obterColunaSincronizada(idColuna);
      if (colunaSincronizadaID) {
        atualizarDestaqueColuna(colunaSincronizadaID, limite, classeDestaque);
      }
    }
  });
}

function atualizarDestaqueColuna(idColuna, limite, classeDestaque) {
  const coluna = document.getElementById(idColuna);
  if (!coluna) return;
  const botoes = Array.from(coluna.querySelectorAll('button'));

  botoes.forEach(btn => {
    btn.classList.remove('botao-destacado-normal', 'botao-destacado-preferencial');
    const match = btn.textContent.match(/Senha (\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num <= limite) {
        btn.classList.add(classeDestaque);
      }
    }
  });
}

function escutarUltimaSenha(tipo) {
  const ref = firebase.database().ref(tipo === 'normal' ? 'contadorNormal' : 'contadorPreferencial');
  ref.on('value', snapshot => {
    const numero = snapshot.val();
    if (tipo === 'normal') {
      atualizarUltimaSenhaNormal(numero ? `Senha ${numero}` : '');
    } else {
      atualizarUltimaSenhaPreferencial(numero ? `Senha ${numero}` : '');
    }
  });
}

function salvarMaiorSenhaFirebase(idColuna, numeroSenha) {
  firebase.database().ref('maioresSenhasPorColuna/' + idColuna).set(numeroSenha);
}

async function atualizarContadorFirebaseSeMaior(tipo, numero) {
  const ref = firebase.database().ref(tipo === 'normal' ? 'contadorNormal' : 'contadorPreferencial');
  const snapshot = await ref.get();
  const atual = snapshot.exists() ? snapshot.val() : 0;

  if (numero > atual) {
    await ref.set(numero);
  }
}

function atualizarUltimaSenhaNormal(texto) {
  const div = document.getElementById('senha-normal');
  if (div) {
    div.textContent = texto;
  }
}

function atualizarUltimaSenhaPreferencial(texto) {
  const div = document.getElementById('senha-preferencial');
  if (div) {
    div.textContent = texto;
  }
}

const maioresSenhasPorColuna = {};

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

  botao.onclick = async () => {
    // Fala a senha
    falar(textoFalado);

    // Adiciona ao histórico
    const agora = new Date();
    historicoChamadas.push({
      tipo: isPreferencial ? "Senha Preferencial" : "Senha Normal",
      senha: texto,
      guiche: destino,
      data: agora.toLocaleDateString('pt-BR'),
      hora: agora.toLocaleTimeString('pt-BR'),
    });

    // Atualiza no Firebase a ultima senha chamada para sincronizar
    await firebase.database().ref('ultimaSenha').set({
      tipo: isPreferencial ? "preferencial" : "normal",
      texto: texto
    });

    // Atualiza contador local e no Firebase se necessário
    if (!maioresSenhasPorColuna[idColuna] || numeroSenha > maioresSenhasPorColuna[idColuna]) {
      maioresSenhasPorColuna[idColuna] = numeroSenha;
      salvarMaiorSenhaFirebase(idColuna, numeroSenha);
      const tipo = isPreferencial ? 'preferencial' : 'normal';
      await atualizarContadorFirebaseSeMaior(tipo, numeroSenha);
    }

    // Atualiza o destaque dos botões da coluna local
    atualizarDestaqueColuna(idColuna, maioresSenhasPorColuna[idColuna], isPreferencial ? 'botao-destacado-preferencial' : 'botao-destacado-normal');

    // Atualiza destaque na coluna sincronizada
    const colunaSincronizadaID = obterColunaSincronizada(idColuna);
    if (colunaSincronizadaID) {
      atualizarDestaqueColuna(colunaSincronizadaID, maioresSenhasPorColuna[idColuna], isPreferencial ? 'botao-destacado-preferencial' : 'botao-destacado-normal');
    }

    botao.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  coluna.appendChild(botao);

  // Se for a última senha chamada, já centraliza
  if (botao.textContent === ultimaSenhaFirebase) {
    botao.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function obterColunaSincronizada(idColuna) {
  if (idColuna === 'coluna-normal-guiche1') return 'coluna-normal-guiche2';
  if (idColuna === 'coluna-normal-guiche2') return 'coluna-normal-guiche1';
  if (idColuna === 'coluna-preferencial-guiche1') return 'coluna-preferencial-guiche2';
  if (idColuna === 'coluna-preferencial-guiche2') return 'coluna-preferencial-guiche1';
  return null;
}

async function restaurarEstadoSenhasFirebase() {
  const snapshot = await firebase.database().ref('maioresSenhasPorColuna').get();
  if (!snapshot.exists()) return;

  const estado = snapshot.val();

  for (let idColuna in estado) {
    maioresSenhasPorColuna[idColuna] = estado[idColuna];
  }

  // Cria os botões e marca destaque
  for (const [idColuna, limite] of Object.entries(maioresSenhasPorColuna)) {
    const isPreferencial = idColuna.includes('preferencial');
    for (let i = 1; i <= limite; i++) {
      const texto = `Senha ${i.toString().padStart(3, '0')} - ${idColuna.includes('guiche1') ? 'Guichê 1' : 'Guichê 2'}`;
      criarBotao(idColuna, texto, isPreferencial ? 'botao-preferencial' : 'botao-normal');
    }
  }

  // Atualiza os destaques
  for (const idColuna in maioresSenhasPorColuna) {
    atualizarDestaqueColuna(idColuna, maioresSenhasPorColuna[idColuna], idColuna.includes('preferencial') ? 'botao-destacado-preferencial' : 'botao-destacado-normal');
  }
}

function falar(texto) {
  const synth = window.speechSynthesis;
  if (!synth) return;

  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = 'pt-BR';
  synth.speak(utterance);
}

// Eventos do teclado para chamar senhas via atalho N1, P1, N2, P2
document.addEventListener('keydown', async (e) => {
  if (e.repeat) return;

  switch (e.code) {
    case 'Digit1':
      if (e.shiftKey) {
        chamarSenha('coluna-preferencial-guiche1');
      } else {
        chamarSenha('coluna-normal-guiche1');
      }
      break;
    case 'Digit2':
      if (e.shiftKey) {
        chamarSenha('coluna-preferencial-guiche2');
      } else {
        chamarSenha('coluna-normal-guiche2');
      }
      break;
  }
});

async function chamarSenha(idColuna) {
  const isPreferencial = idColuna.includes('preferencial');
  contadorLocal[isPreferencial ? 'preferencial' : 'normal']++;
  const numeroSenha = contadorLocal[isPreferencial ? 'preferencial' : 'normal'];
  const texto = `Senha ${numeroSenha.toString().padStart(3, '0')} - ${idColuna.includes('guiche1') ? 'Guichê 1' : 'Guichê 2'}`;

  criarBotao(idColuna, texto, isPreferencial ? 'botao-preferencial' : 'botao-normal');

  // Simula clique para chamar a senha
  const coluna = document.getElementById(idColuna);
  if (!coluna) return;

  // Encontra o botão recém-criado e aciona onclick
  const botoes = coluna.querySelectorAll('button');
  const botaoRecente = botoes[botoes.length - 1];
  if (botaoRecente) {
    botaoRecente.click();
  }
}

// Inicialização
window.onload = () => {
  restaurarEstadoSenhasFirebase();
  escutarAlteracoesMaioresSenhas();
};
