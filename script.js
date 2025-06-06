function aplicarDestaqueSenha(data) {
  const { idColuna, numeroSenha, classeDestaque } = data;

  maioresSenhasPorColuna[idColuna] = Math.max(maioresSenhasPorColuna[idColuna] || 0, numeroSenha);

  const limite = maioresSenhasPorColuna[idColuna];
  const coluna = document.getElementById(idColuna);
  if (!coluna) return;

  const botoes = Array.from(coluna.querySelectorAll('button'));
  let botaoMaior = null;	
botoes.forEach(btn => {
    const match = btn.textContent.match(/Senha (\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num <= limite) {
        btn.classList.add(classeDestaque);
        if (num === limite) botaoMaior = btn;
      } else {
        btn.classList.remove('botao-destacado-normal', 'botao-destacado-preferencial');
      }
    }
  });

  if (botaoMaior) {
    setTimeout(() => {
      botaoMaior.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
  }

  const idColunaSincronizada = obterColunaSincronizada(idColuna);
  if (idColunaSincronizada) {
    maioresSenhasPorColuna[idColunaSincronizada] = Math.max(maioresSenhasPorColuna[idColunaSincronizada] || 0, numeroSenha);

    const limiteSincronizada = maioresSenhasPorColuna[idColunaSincronizada];
    const colunaOutro = document.getElementById(idColunaSincronizada);
    if (colunaOutro) {
      const botoesOutro = Array.from(colunaOutro.querySelectorAll('button'));
      let botaoMaiorOutro = null; 
	    
botoesOutro.forEach(btn => {
        const match = btn.textContent.match(/Senha (\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num <= limiteSincronizada) {
            btn.classList.add(classeDestaque);
            if (num === limiteSincronizada) botaoMaiorOutro = btn;
          } else {
            btn.classList.remove('botao-destacado-normal', 'botao-destacado-preferencial');
          }
        }
      });

      if (botaoMaiorOutro) {
        setTimeout(() => {
          botaoMaiorOutro.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
      }
    }
  }

  // Atualiza os campos "Última Senha"
  const texto = Array.from(coluna.querySelectorAll('button'))
    .find(btn => btn.textContent.includes(`Senha ${numeroSenha} -`))?.textContent;
  if (texto) {
    if (idColuna.includes("preferencial")) atualizarUltimaSenhaPreferencial(texto);
    else atualizarUltimaSenhaNormal(texto);
  }
}


firebase.database().ref('ultimaSenhaChamada').on('value', (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  aplicarDestaqueSenha(data);
});

function atualizarCaixasUltimaSenha(data) {
  const { idColuna, textoSenha } = data;

  if (idColuna.includes('preferencial')) {
    atualizarUltimaSenhaPreferencial(textoSenha);
  } else if (idColuna.includes('normal')) {
    atualizarUltimaSenhaNormal(textoSenha);
  }
}

const historicoChamadas = [];

const contadorLocal = {
  normal: 0,
  preferencial: 0
};


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

function falarVacAdulto() {
  falar("Atenção, para vacinação adulto, tenha em mãos documento com foto");
}

function falarVacInfantil() {
  falar("Atenção, para vacinação infantil, tenha em mãos caderneta de vacinação");
}

function falarRetiradaGuias() {
  falar("Atenção, para retirada de guias, tenha em mãos documento do titular do agendamento");
}

function voltarAoTopo() {
  const colunas = document.querySelectorAll('.coluna');
  colunas.forEach(coluna => {
    coluna.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function voltarAoFundo() {
  const colunas = document.querySelectorAll('.coluna');
  colunas.forEach(coluna => {
    coluna.scrollTo({ top: coluna.scrollHeight, behavior: 'smooth' });
  });
}

async function limparSenhas() {
  
  await firebase.database().ref('contadorNormal').set(0);
  await firebase.database().ref('contadorPreferencial').set(0);
  await firebase.database().ref('maioresSenhasPorColuna').remove();

  contadorLocal.normal = 0;
  contadorLocal.preferencial = 0;

  for (let key in maioresSenhasPorColuna) {
    maioresSenhasPorColuna[key] = 0;
  }

  const botoes = document.querySelectorAll('.coluna button');
  botoes.forEach(btn => {
    btn.classList.remove('botao-destacado-normal', 'botao-destacado-preferencial');
  });

  atualizarUltimaSenhaNormal('');
  atualizarUltimaSenhaPreferencial('');

  const colunas = document.querySelectorAll('.coluna');
  colunas.forEach(coluna => {
    coluna.scrollTo({ top: 0, behavior: 'smooth' });
  });

}


function carregarVozes(callback) {
  const synth = window.speechSynthesis;

  function tentarCarregar() {
    const vozes = synth.getVoices();
    if (vozes.length > 0) {
      callback(vozes);
    } else {
      setTimeout(tentarCarregar, 100);
    }
  }

  tentarCarregar();
}

function falar(texto) {
  const synth = window.speechSynthesis;
  const msg = new SpeechSynthesisUtterance();
  msg.text = texto;
  msg.lang = 'pt-BR';
  msg.rate = 1.2;

  const vozSelecionada = document.getElementById("vozSelecionada")?.value;

  carregarVozes((vozes) => {
    const voz = vozes.find(v => v.name === vozSelecionada);

    if (voz) {
      msg.voice = voz;
      console.log(`✅ Usando voz: ${voz.name}`);
    } else {
      console.warn(`⚠️ Voz "${vozSelecionada}" não encontrada. Usando voz padrão.`);
    }

    synth.speak(msg);
  });
}

function chamarNome(guiche) {
  const nome = document.getElementById('nomePessoa').value.trim();
  if (nome === '') {
    alert('Por favor, digite um nome.');
    return;
  }

  let mensagem = '';
  let guicheTexto = '';

  if (guiche === 1) {
    mensagem = `Atenção, ${nome}, dirija-se ao guichê 1`;
    guicheTexto = "Guichê 1";
  } else if (guiche === 2) {
    mensagem = `Atenção, ${nome}, dirija-se ao guichê 2`;
    guicheTexto = "Guichê 2";
  } else if (guiche === 3) {
    mensagem = `Atenção, ${nome}, dirija-se ao pós consulta`;
    guicheTexto = "Pós Consulta";
  } else if (guiche === 4) {
    mensagem = `${nome}`;
    guicheTexto = "Leitura em voz alta";
  }

  const agora = new Date();
  historicoChamadas.push({
    tipo: "Chamada por nome",
    nome: nome,
    guiche: guicheTexto,
    data: agora.toLocaleDateString('pt-BR'),
    hora: agora.toLocaleTimeString('pt-BR'),
  });

  falar(mensagem);
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

const ultimosBotoesPorColuna = {};
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

  if (isPreferencial) {
    atualizarUltimaSenhaPreferencial(texto);
  } else {
    atualizarUltimaSenhaNormal(texto);
  }

  // 🔁 ATUALIZA histórico de maior senha chamada, se necessário
  if (!maioresSenhasPorColuna[idColuna] || numeroSenha > maioresSenhasPorColuna[idColuna]) {
    maioresSenhasPorColuna[idColuna] = numeroSenha;
    salvarMaiorSenhaFirebase(idColuna, numeroSenha);
    const tipo = isPreferencial ? 'preferencial' : 'normal';
    atualizarContadorFirebaseSeMaior(tipo, numeroSenha);
  }

  // ✅ Sempre usa o maior número já chamado (não o número clicado!)
  const limite = maioresSenhasPorColuna[idColuna];
  const classeDestaque = isPreferencial ? 'botao-destacado-preferencial' : 'botao-destacado-normal';

  const botoesNaColuna = Array.from(coluna.querySelectorAll('button'));

  // 🔄 LIMPA e DESTACA baseado no maior chamado
  botoesNaColuna.forEach(btn => {
    btn.classList.remove('botao-destacado-normal', 'botao-destacado-preferencial');
  });

  botoesNaColuna.forEach(btn => {
    const match = btn.textContent.match(/Senha (\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num <= limite) {
        btn.classList.add(classeDestaque);
      }
    }
  });

  // 🔁 Mesma lógica para a COLUNA SINCRONIZADA
  const colunaSincronizadaID = obterColunaSincronizada(idColuna);
  if (colunaSincronizadaID) {
    const colunaOutro = document.getElementById(colunaSincronizadaID);
    if (colunaOutro) {
      const botoesOutro = Array.from(colunaOutro.querySelectorAll('button'));
      botoesOutro.forEach(btn => {
        btn.classList.remove('botao-destacado-normal', 'botao-destacado-preferencial');
      });
      botoesOutro.forEach(btn => {
        const match = btn.textContent.match(/Senha (\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num <= limite) {
            btn.classList.add(classeDestaque);
          }
        }
      });
    }
  }

  // 🎯 Scroll apenas na senha clicada (não afeta os hovers)
 if (!maioresSenhasPorColuna[idColuna] || numeroSenha >= maioresSenhasPorColuna[idColuna]) {
  setTimeout(() => {
    botao.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}


  // 📡 Envia ao Firebase
  firebase.database().ref('ultimaSenhaChamada').set({
    idColuna: idColuna,
    numeroSenha: numeroSenha,
    classeDestaque: classeDestaque,
    textoSenha: texto,
    timestamp: Date.now()
  });

  ultimaSenhaChamada = botao;
};


  coluna.appendChild(botao);
}

async function restaurarEstadoSenhasFirebase() {
  const snapshot = await firebase.database().ref('maioresSenhasPorColuna').get();
  if (!snapshot.exists()) return;

  const estado = snapshot.val();

  for (let idColuna in estado) {
    const limite = estado[idColuna];
    const isPreferencial = idColuna.includes("preferencial");
    const classeDestaque = isPreferencial ? 'botao-destacado-preferencial' : 'botao-destacado-normal';

    const coluna = document.getElementById(idColuna);
    if (coluna) {
      const botoes = Array.from(coluna.querySelectorAll('button'));
      botoes.forEach(btn => {
        const match = btn.textContent.match(/Senha (\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num <= limite) {
            btn.classList.add(classeDestaque);
          }
        }
      });
    }
  }
}

function obterColunaSincronizada(idColuna) {
  if (idColuna === 'coluna-normal-guiche1') return 'coluna-normal-guiche2';
  if (idColuna === 'coluna-normal-guiche2') return 'coluna-normal-guiche1';
  if (idColuna === 'coluna-preferencial-guiche1') return 'coluna-preferencial-guiche2';
  if (idColuna === 'coluna-preferencial-guiche2') return 'coluna-preferencial-guiche1';
  return null;
}

function registrarChamadaFirebase(idColuna, numeroSenha, classeDestaque) {
  firebase.database().ref('ultimaSenhaChamada').set({
    idColuna,
    numeroSenha,
    classeDestaque,
    timestamp: Date.now()
  });
}

// Impede scroll nativo ao clicar manualmente em senha menor
function bloquearScrollAoClicarEmBotao(botao) {
  botao.addEventListener('mousedown', e => {
    e.preventDefault();
  });
}

for (let i = 1; i <= 999; i++) {
  const numero = i.toString().padStart(1, '0');
  criarBotao("coluna-normal-guiche1", `Senha ${numero} - Guichê 1`, 'botao-preto');
  criarBotao("coluna-normal-guiche2", `Senha ${numero} - Guichê 2`, 'botao-preto');
  criarBotao("coluna-normal-posconsulta", `Senha ${numero} - Pós Consulta`, 'botao-preto');
}

for (let i = 1; i <= 999; i++) {
  const numero = i.toString().padStart(1, '0');
  criarBotao("coluna-preferencial-guiche1", `Senha ${numero} - Guichê 1`, 'botao-vermelho');
  criarBotao("coluna-preferencial-guiche2", `Senha ${numero} - Guichê 2`, 'botao-vermelho');
  criarBotao("coluna-preferencial-posconsulta", `Senha ${numero} - Pós Consulta`, 'botao-vermelho');
}

function exportarChamadasCSV() {
  if (historicoChamadas.length === 0) {
    alert("Nenhuma chamada registrada.");
    return;
  }

  let csv = "Tipo,Nome/Senha,Guichê,Data,Hora\n";

  historicoChamadas.forEach(registro => {
    const linha = [
      registro.tipo,
      registro.nome || registro.senha || "",
      registro.guiche,
      registro.data,
      registro.hora
    ].map(campo => `"${campo}"`).join(",");
    csv += linha + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "historico_chamadas.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function atualizarControlesGuiche() {
  const guiche1 = document.getElementById("check-guiche1").checked;
  const guiche2 = document.getElementById("check-guiche2").checked;
  const posConsulta = document.getElementById("check-posconsulta").checked;

  let habilitarGuiche1 = false;
  let habilitarGuiche2 = false;
  let habilitarPosConsulta = false;

  if (guiche1 && guiche2 && posConsulta) {
    habilitarGuiche1 = habilitarGuiche2 = habilitarPosConsulta = true;
  } else if (guiche1 && guiche2) {
    habilitarGuiche1 = habilitarGuiche2 = true;
  } else if (guiche1 && posConsulta) {
    habilitarGuiche1 = habilitarPosConsulta = true;
  } else if (guiche2 && posConsulta) {
    habilitarGuiche2 = habilitarPosConsulta = true;
  } else if (guiche1) {
    habilitarGuiche1 = true;
  } else if (guiche2) {
    habilitarGuiche2 = true;
  } else if (posConsulta) {
    habilitarPosConsulta = true;
  }

  document.querySelector('button.botao-amarelo').disabled = !habilitarGuiche1;
  document.querySelector('button.botao-verde').disabled = !habilitarGuiche2;
  document.querySelector('button.botao-lilas').disabled = !habilitarPosConsulta;

  toggleColunaBotoes("coluna-normal-guiche1", habilitarGuiche1);
  toggleColunaBotoes("coluna-preferencial-guiche1", habilitarGuiche1);

  toggleColunaBotoes("coluna-normal-guiche2", habilitarGuiche2);
  toggleColunaBotoes("coluna-preferencial-guiche2", habilitarGuiche2);

  toggleColunaBotoes("coluna-normal-posconsulta", habilitarPosConsulta);
  toggleColunaBotoes("coluna-preferencial-posconsulta", habilitarPosConsulta);
}

function toggleColunaBotoes(idColuna, habilitar) {
  const coluna = document.getElementById(idColuna);
  if (coluna) {
    const botoes = coluna.querySelectorAll("button");
    botoes.forEach(btn => {
      btn.disabled = !habilitar;
      btn.classList.toggle('desabilitado', !habilitar);
    });
  }
}

window.speechSynthesis.onvoiceschanged = () => {
  carregarVozes(() => {});
};

document.addEventListener("DOMContentLoaded", async function () {
  forcarSelecaoGuiche();
  const confirmar = confirm("Deseja reiniciar a contagem de senhas?");
  if (confirmar) {
    await limparSenhas();
  } else {
    await restaurarEstadoSenhasFirebase();
  }
});

function forcarSelecaoGuiche() {
  const check1 = document.getElementById("check-guiche1");
  const check2 = document.getElementById("check-guiche2");
  const check3 = document.getElementById("check-posconsulta");

  function nenhumSelecionado() {
    return !check1.checked && !check2.checked && !check3.checked;
  }

  if (nenhumSelecionado()) {
    setTimeout(() => {
      alert("⚠️ Por favor, selecione um guichê (Guichê 1, Guichê 2 ou Pós Consulta) antes de continuar.");
    }, 300);

    atualizarControlesGuiche();
  }

  check1.addEventListener("change", () => {
    if (!nenhumSelecionado()) atualizarControlesGuiche();
  });
  check2.addEventListener("change", () => {
    if (!nenhumSelecionado()) atualizarControlesGuiche();
  });
  check3.addEventListener("change", () => {
    if (!nenhumSelecionado()) atualizarControlesGuiche();
  });
}

document.getElementById("check-guiche1").addEventListener("change", atualizarControlesGuiche);
document.getElementById("check-guiche2").addEventListener("change", atualizarControlesGuiche);
document.getElementById("check-posconsulta").addEventListener("change", atualizarControlesGuiche);

window.addEventListener("DOMContentLoaded", atualizarControlesGuiche);

let ultimaSenhaChamada = null;

async function chamarSenhaSincronizada(tipo, guiche) {
  const ref = firebase.database().ref(tipo === 'normal' ? 'contadorNormal' : 'contadorPreferencial');
  const snapshot = await ref.get();
  let contador = snapshot.exists() ? snapshot.val() : 0;
  contador += 1;
  await ref.set(contador);

  const idColuna = tipo === 'normal'
    ? (guiche === 1 ? 'coluna-normal-guiche1' : 'coluna-normal-guiche2')
    : (guiche === 1 ? 'coluna-preferencial-guiche1' : 'coluna-preferencial-guiche2');

  const coluna = document.getElementById(idColuna);
  const botoes = Array.from(coluna.querySelectorAll('button'));
  const botao = botoes.find(b => b.textContent.includes(`Senha ${contador} -`));

  if (botao) {
    botao.click();
	firebase.database().ref('ultimaSenhaChamada').set({
  idColuna: idColuna,
  numeroSenha: numeroSenha,
  classeDestaque: classeDestaque,
  timestamp: Date.now()
});

  } else {
    console.error('Botão não encontrado:', `Senha ${contador} - Guichê ${guiche}`);
  }
}

function chamarSenhaLocal(tipo) {
  contadorLocal[tipo] += 1;
  const guiche = 'Pós Consulta';
  const idColuna = tipo === 'normal' ? 'coluna-normal-posconsulta' : 'coluna-preferencial-posconsulta';

  const coluna = document.getElementById(idColuna);
  const botoes = Array.from(coluna.querySelectorAll('button'));
  const botao = botoes.find(b => b.textContent.includes(`Senha ${contadorLocal[tipo]} -`));

  if (botao) {
    botao.click();
  } else {
    console.error('Botão não encontrado:', `Senha ${contadorLocal[tipo]} - ${guiche}`);
  }
}


function repetirUltimaSenha() {
  if (!ultimaSenhaChamada) return;

  const texto = ultimaSenhaChamada.textContent;
  const numeroSenha = parseInt(texto.match(/Senha (\d+)/)?.[1], 10);
  const destino = texto.split(" - ")[1];

  // Verifica diretamente a qual coluna o botão pertence
  const coluna = ultimaSenhaChamada.closest(".coluna");
  const isPreferencial = coluna?.id?.includes("preferencial");

  const textoFalado = isPreferencial
    ? `Senha ${numeroSenha}, preferencial, ${destino}`
    : `Senha ${numeroSenha}, normal, ${destino}`;

  falar(textoFalado);
}


let enterPressionadoRecentemente = false;

document.addEventListener("keydown", function (event) {
  const tecla = event.key.toLowerCase();
  const inputNome = document.getElementById("nomePessoa");

  if (document.activeElement === inputNome) {
    return;
  }

  if (tecla === 'r' || event.code === 'Space') {
    event.preventDefault(); // evita rolagem da página com espaço
    repetirUltimaSenha();
  } else if (tecla === 'n') {
    esperarSegundoKey('n');
  } else if (tecla === 'p') {
    esperarSegundoKey('p');
  } else if (tecla === 'enter') {
    if (enterPressionadoRecentemente) return; // Evita repetição
	      enterPressionadoRecentemente = true;
setTimeout(() => {
      enterPressionadoRecentemente = false;
    }, 500); // 0,5s de bloqueio para evitar duplo acionamento
  }
});

let botaoSelecionado = null;

document.addEventListener("keydown", function (event) {
  if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

  const todasColunas = document.querySelectorAll('.coluna');
  const botoesTodos = Array.from(document.querySelectorAll('.coluna button')).filter(btn => !btn.disabled);

  if (!botoesTodos.length) return;

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();

    if (!botaoSelecionado) {
      botaoSelecionado = botoesTodos[0];
      botaoSelecionado.focus();
      return;
    }

    const coluna = botaoSelecionado.closest('.coluna');
    const botoesNaColuna = Array.from(coluna.querySelectorAll('button')).filter(btn => !btn.disabled);
    const indexAtual = botoesNaColuna.indexOf(botaoSelecionado);

    if (event.key === 'ArrowDown' && indexAtual < botoesNaColuna.length - 1) {
      botaoSelecionado = botoesNaColuna[indexAtual + 1];
      botaoSelecionado.focus();
    } else if (event.key === 'ArrowUp' && indexAtual > 0) {
      botaoSelecionado = botoesNaColuna[indexAtual - 1];
      botaoSelecionado.focus();
    }
  }

  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();

    if (!botaoSelecionado) {
      botaoSelecionado = botoesTodos[0];
      botaoSelecionado.focus();
      return;
    }

    const colunaAtual = botaoSelecionado.closest('.coluna');
    const colunas = Array.from(document.querySelectorAll('.coluna'));
    const indexColuna = colunas.indexOf(colunaAtual);

    const novaColuna = event.key === 'ArrowRight'
      ? colunas[indexColuna + 1]
      : colunas[indexColuna - 1];

    if (novaColuna) {
      const textoSenha = botaoSelecionado.textContent.match(/Senha \d+/);
      const botaoMesmoNumero = Array.from(novaColuna.querySelectorAll('button')).find(b =>
        b.textContent.includes(textoSenha)
      );
      if (botaoMesmoNumero) {
        botaoSelecionado = botaoMesmoNumero;
        botaoSelecionado.focus();
      }
    }
  }
});


function esperarSegundoKey(tipo) {
  function segundaLetra(e) {
    const k = e.key;

    if (tipo === 'n') {
      if (k === '1') chamarSenhaSincronizada('normal', 1);
      else if (k === '2') chamarSenhaSincronizada('normal', 2);
      else if (k === '3') chamarSenhaLocal('normal');
    } else if (tipo === 'p') {
      if (k === '1') chamarSenhaSincronizada('preferencial', 1);
      else if (k === '2') chamarSenhaSincronizada('preferencial', 2);
      else if (k === '3') chamarSenhaLocal('preferencial');
    }

    document.removeEventListener('keydown', segundaLetra);
  }

  document.addEventListener('keydown', segundaLetra);
}
