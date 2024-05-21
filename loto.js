const session = require('express-session');
const express = require('express');
const sha1 = require('sha1');
const fs = require('fs');

const servidor = express();
var porto = 8080;

servidor.use(express.urlencoded({
    extended: true
}));

servidor.use(express.static('public'));

servidor.set('view engine', 'ejs');

servidor.use(session({
    secret: "supercalifragilisticexpialidocious",
    resave: false,
    saveUninitialized: true
}));

servidor.listen(porto, function () {
    console.log('servidor a ser executado em http://localhost:' + porto);
});

var topo = '';
topo += '<!DOCTYPE html>\n';
topo += '<html>\n';
topo += '<head>\n';
topo += '<meta charset="utf-8">\n';
topo += '<title>Loto Online</title>\n';
topo += '<style>\n';
topo += 'font-family: sans-serif}\n';
topo += '</style>\n';
topo += '</head>\n';
topo += '<body>\n';

var fundo = '';
fundo += '<p><a href="/">home</a></p>\n';
fundo += '</body>\n';
fundo += '</html>\n';

servidor.get('/', function (req, res) {
    var titulo = '';
    var username = null;
    var feijoes = 0;
    if (req.session.username) {
        username = req.session.username;
        try {
            var registos = JSON.parse(fs.readFileSync('registos.json'));
            var username = registos.find(u => u.username === username);
            if (username) {
                feijoes = username.feijoes;
            }
        } catch (erro) {
            console.error('Erro ao ler o arquivo de registros');
        }
    }
    res.render('pages/index', { titulo: titulo, username: username, feijoes: feijoes });
});

servidor.get('/le_registo', function (req, res) {
    var mensagem = '';
    var registoUtilizador = null;
    if (req.session.username) {
        var registos = new Array();
        try {
            registos = JSON.parse(fs.readFileSync('registos.json'));
            if (!Array.isArray(registos)) {
                registos = new Array();
            }
        }
        catch (erro) {
            registos = new Array();
        }

        if (registos.length > 0) {
            for (var i = 0; i < registos.length; i++) {
                if (registos[i].username == req.session.username) {
                    registoUtilizador = registos[i];
                }
            }
            if (registoUtilizador == null) {
                mensagem = 'Não foi possível encontrar a tua conta. Por favor, regista-te.';
            }
        }
        else {
            mensagem = 'ficheiro vazio ou sem registos';
        }
    }
    else {
        mensagem = 'calma: não tem acesso a este conteúdo restrito';
    }
    res.render('pages/le_registo', { titulo: 'lê registo', registoUtilizador: registoUtilizador, mensagem: mensagem });
});

servidor.get('/processa_registo', function (req, res) {
    var nome = req.query.nome;
    var username = req.query.username;
    var password = sha1(req.query.password);
    var codigoAmigo = req.query.codigoAmigo;

    var html = '';
    html += '<!DOCTYPE html>\n';
    html += '<html>\n';
    html += '<head>\n';
    html += '<meta charset="utf-8">\n';
    html += '<title>Loto Online</title>\n';
    html += '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">\n';
    html += '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>\n';
    html += '<style>\n';
    html += 'body { background-color: #dee2e6;}\n';
    html += '#processa_registo {text-align: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);}\n';
    html += '</style>\n';
    html += '</head>\n';
    html += '<body>\n';
    html += '<div id="processa_registo">\n';

    if (nome && username && password) {
        // Gerar código de referência único para o novo utilizador
        const codigoReferencia = Math.random().toString(36).substring(2, 8);

        // Definir os dados do novo registro
        var dadosRegisto = {
            "nome": nome,
            "username": username,
            "password": password,
            "feijoes": 100,
            "codigoReferencia": codigoReferencia
        };

        // Verificar se o nome de utilizador já existe
        try {
            var registos = JSON.parse(fs.readFileSync('registos.json'));
            if (registos.some(user => user.username === username)) {
                html += '<h1>Erro</h1>\n';
                html += '<p>Este nome de utilizador já está em uso. Por favor, seleciona outro.</p>\n';
                html += '<p><a href="/" class="btn btn-primary">Voltar</a></p>\n';
                html += '</body>\n';
                html += '</html>\n';
                res.send(html);
                return;
            }
        } catch (error) {
            console.error('Erro ao ler o arquivo de registros:', error);
            html += '<h1>Erro</h1>\n';
            html += '<p>Ocorreu um erro ao processar o seu registo. Por favor, tenta novamente mais tarde.</p>\n';
            html += '<p><a href="/" class="btn btn-primary">Voltar</a></p>\n';
            html += '</body>\n';
            html += '</html>\n';
            res.send(html);
            return;
        }

        // Restante do código de processamento do registo...
        // Ler os registros existentes
        var registos = [];
        try {
            registos = JSON.parse(fs.readFileSync('registos.json'));
            if (!Array.isArray(registos)) {
                console.error('ficheiro inexistente ou sem registos anteriores');
                registos = [];
            }
        } catch (error) {
            console.error('erro ao ler o arquivo de registros:', error);
            registos = [];
        }

        // Processar o código do amigo, se fornecido
        if (codigoAmigo) {
            // Encontrar o utilizador amigo nos registros
            const userAmigo = registos.find(u => u.codigoReferencia === codigoAmigo);
            if (userAmigo) {
                // Adicionar 25 feijões extras à conta do utilizador amigo
                userAmigo.feijoes += 50;

                // Adicionar 50 feijões à conta do utilizador atual
                dadosRegisto.feijoes += 25;
            }
        }

        // Adicionar o novo utilizador aos registros
        registos.push(dadosRegisto);

        // Salvar os registros atualizados no arquivo JSON
        try {
            fs.writeFileSync('registos.json', JSON.stringify(registos));
            html += '<h1>Sucesso</h1>';
            html += '<p>Criaste a tua conta. Boas apostas!</p>';
            html += '<p><a href="/" class="btn btn-primary">Avançar</a></p>\n';
            html += '</body>\n';
            html += '</html>\n';
        } catch (error) {
            console.error('erro ao guardar dados no arquivo:', error);
            html += '<p>Ocorreu um erro ao criar a conta. Por favor, tenta novamente.</p>';
            html += '<p><a href="/" class="btn btn-primary">Regressar</a></p>\n';
            html += '</body>\n';
            html += '</html>\n';
        }
    } else {
        html += '<p>Por favor, preenche todos os campos.</p>';
        html += '<p><a href="/" class="btn btn-primary">Regressar</a></p>\n';
        html += '</body>\n';
        html += '</html>\n';
    }
    res.send(html);
});

servidor.get('/altera_registo', function (req, res) {
    var mensagem = '';
    var registoUtilizador = null;
    if (req.session.username) {
        var registos = new Array();
        try {
            registos = JSON.parse(fs.readFileSync('registos.json'));
            if (!Array.isArray(registos)) {
                registos = new Array();
            }
        }
        catch (erro) {
            registos = new Array();
        }

        if (registos.length > 0) {
            for (var i = 0; i < registos.length; i++) {
                if (registos[i].username == req.session.username) {
                    registoUtilizador = registos[i];
                }
            }
            if (registoUtilizador == null) {
                mensagem = 'registo de utilizador não encontrado';
            }
        }
        else {
            mensagem = 'ficheiro vazio ou sem registos';
        }
    }
    else {
        mensagem = 'calma: não tem acesso a este conteúdo restrito';
    }
    res.render('pages/altera_registo', { titulo: 'Conta', registoUtilizador: registoUtilizador, mensagem: mensagem });
});

servidor.get('/processa_altera_registo', function (req, res) {
    var nome = req.query.nome;
    var username = req.query.username;
    var password = sha1(req.query.password);

    var html = '';
    html += topo;
    html += '<h1>processa altera registo</h1>\n';
    if (req.session.username) {
        if (nome && username && password) {
            html += '<p>\n';
            html += 'nome: ' + nome + '<br>\n';
            html += 'username: ' + username + '<br>\n';
            html += 'password: ' + password + '\n';
            html += '</p>\n';

            var dadosAlterados = { "nome": nome, "username": username, "password": password };
            var registos = new Array();
            try {
                registos = JSON.parse(fs.readFileSync('registos.json'));
                if (!Array.isArray(registos)) {
                    console.error('ficheiro inexistente ou sem registos anteriores');
                    registos = new Array();
                }
            }
            catch (erro) {
                console.error('ficheiro inexistente ou sem registos anteriores');
                registos = new Array();
            }

            for (var i = 0; i < registos.length; i++) {
                if (registos[i].username == req.session.username) {
                    registos[i].nome = dadosAlterados.nome;
                    registos[i].password = dadosAlterados.password;
                }
            }

            try {
                fs.writeFileSync('registos.json', JSON.stringify(registos));
                html += '<p>dados guardados no ficheiro</p>\n';
            }
            catch (erro) {
                console.error("erro ao guardar dados no ficheiro");
                console.error(erro);
                html += '<p>erro ao guardar os dados no ficheiro</p>\n';
            }
        }
        else {
            html += '<p>por favor, preenche os dados todos</p>\n';
        }
    }
    else {
        html += '<p>calma: não tem acesso a este conteúdo restrito</p>\n';
    }
    html += fundo;
    res.send(html);
});

servidor.get('/apaga_registo', function (req, res) {
    var html = '';
    html += '<!DOCTYPE html>\n';
    html += '<html>\n';
    html += '<head>\n';
    html += '<meta charset="utf-8">\n';
    html += '<title>Loto Online</title>\n';
    html += '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">\n';
    html += '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>\n';
    html += '<style>\n';
    html += 'body { background-color: #dee2e6;}\n';
    html += '#apaga_registo {text-align: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);}\n';
    html += '</style>\n';
    html += '</head>\n';
    html += '<body>\n';
    html += '<div id="apaga_registo">\n';
    html += '<h1>Eliminar Conta</h1>\n';
    if (req.session.username) {
        html += '<p>Tens a certeza que queres eliminar a tua conta?<br>\n';
        html += '<button class="btn btn-primary" onclick="window.location.href=\'/processa_apaga_registo\'"">Sim</button> <button class="btn btn-primary" onclick="window.location.href=\'/altera_registo\'">Não</button>\n';
    }
    else {
        html += '<p>Não tens acesso a este conteúdo restrito</p>\n';
        html += '<p><a href="/" class="btn btn-primary">Regressar</a></p>\n';
    }
    html += '</body>\n';
    html += '</html>\n';
    res.type('html');
    res.send(html);
});

servidor.get('/processa_apaga_registo', function (req, res) {
    var html = '';
    html += '<!DOCTYPE html>\n';
    html += '<html>\n';
    html += '<head>\n';
    html += '<meta charset="utf-8">\n';
    html += '<title>Loto Online</title>\n';
    html += '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">\n';
    html += '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>\n';
    html += '<style>\n';
    html += 'body { background-color: #dee2e6;}\n';
    html += '#processa_apaga_registo {text-align: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);}\n';
    html += '</style>\n';
    html += '</head>\n';
    html += '<body>\n';
    html += '<div id="processa_apaga_registo">\n';
    if (req.session.username) {
        var registos = new Array();
        try {
            registos = JSON.parse(fs.readFileSync('registos.json'));
            if (!Array.isArray(registos)) {
                console.error('ficheiro inexistente ou sem registos anteriores');
                registos = new Array();
            }
        }
        catch (erro) {
            console.error('ficheiro inexistente ou sem registos anteriores');
            registos = new Array();
        }

        for (var i = 0; i < registos.length; i++) {
            if (registos[i].username == req.session.username) {
                registos.splice(i, 1);
            }
        }

        try {
            fs.writeFileSync('registos.json', JSON.stringify(registos));
            html += '<h1>Sucesso</p>\n';
            html += '<p>A tua conta foi eliminada!</p>\n';
        }
        catch (erro) {
            console.error("erro ao eliminar dados no ficheiro");
            console.error(erro);
            html += '<p>Erro ao eliminar conta</p>\n';
        }
    }
    else {
        html += '<p>Não tens acesso a este conteúdo restrito.</p>\n';
    }
    html += '<p><a href="/" class="btn btn-primary">Avançar</a></p>\n';
    html += '</body>\n';
    html += '</html>\n';
    res.send(html);
});

servidor.get('/processa_login', function (req, res) {
    var username = req.query.username;
    var password = req.query.password;

    var html = '';
    html += '<!DOCTYPE html>\n';
    html += '<html>\n';
    html += '<head>\n';
    html += '<meta charset="utf-8">\n';
    html += '<title>Loto Online</title>\n';
    html += '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">\n';
    html += '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>\n';
    html += '<style>\n';
    html += 'body { background-color: #f6f4f4;}\n';
    html += '#processa_login {text-align: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);}\n';
    html += '</style>\n';
    html += '</head>\n';
    html += '<body>\n';
    html += '<div id="processa_login">\n';

    if (username && password) {

        var loginUtilizador = { 'username': username, 'password': password };
        var registos = [];

        try {
            var dadosFicheiro = fs.readFileSync('registos.json', 'utf-8');
            registos = JSON.parse(dadosFicheiro);
            if (!Array.isArray(registos)) {
                console.error('ficheiro inexistente ou sem registos anteriores');
                registos = [];
            }
        }
        catch (error) {
            console.error('ficheiro inexistente ou sem registos anteriores');
            registos = [];
        }

        var utilizadorAutenticado = false;
        for (var i = 0; i < registos.length; i++) {
            if (registos[i].username === loginUtilizador.username && registos[i].password === loginUtilizador.password) {
                utilizadorAutenticado = true;
                break;
            }
        }
        if (utilizadorAutenticado) {
            req.session.username = loginUtilizador.username;
            html += '<h1>Sucesso</h1>\n';
            html += '<p>Acabaste de iniciar sessão. Boas apostas!</p>\n';
            html += '<p><a href="/" class="btn btn-warning"><b>Avançar<b></a></p>\n';
        }
        else {
            html += '<h1>Insucesso</h1>\n';
            html += '<p>Não foi possível encontrar a tua conta. Por favor, regista-te.</p>\n';
            html += '<p><a href="/" class="btn btn-outline-secondary">Regressar</a></p>\n';
        }
    }
    else {
        html += '<h1>Insucesso</h1>\n';
        html += '<p>Por favor, preenche os dados todos!</p>\n';
    }
    html += '</div>\n';
    html += '</body>\n';
    html += '</html>\n';
    res.send(html);
});


servidor.get('/processa_logout', function (req, res) {
    req.session.destroy();
    var html = '';


    html += '<!DOCTYPE html>\n';
    html += '<html>\n';
    html += '<head>\n';
    html += '<meta charset="utf-8">\n';
    html += '<title>Loto Online</title>\n';
    html += '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">\n';
    html += '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>\n';
    html += '<style>\n';
    html += 'body { background-color: #f6f4f4;}\n';
    html += '#processa_logout {text-align: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);}\n';
    html += '</style>\n';
    html += '</head>\n';
    html += '<body>\n';
    html += '<div id="processa_logout">\n';
    html += '<h1>Sessão Terminada</h1>\n';
    html += '<p><a href="/" class="btn btn-warning w-100" >Avançar</a></p>\n';
    html += '</div>\n';
    html += '</body>\n';
    html += '</html>\n';
    res.send(html);
});

servidor.post('/processa_aposta', function (req, res) {
    // Verificar se o utilizador está logado
    if (!req.session.username) {
        res.redirect('/'); // Redirecionar para a página inicial se o utilizador não estiver logado
        return;
    }

    // Deduzir 10 feijões da conta do utilizador
    var username = req.session.username;
    var registos = [];
    try {
        registos = JSON.parse(fs.readFileSync('registos.json'));
        if (!Array.isArray(registos)) {
            console.error('ficheiro inexistente ou sem registos anteriores');
            registos = [];
        }
    } catch (error) {
        console.error('erro ao ler o arquivo de registros:', error);
        registos = [];
    }

    // Encontrar o utilizador nos registros
    var userData = registos.find(u => u.username === username);
    if (userData) {
        // Verificar se o utilizador tem pelo menos 10 feijões
        if (userData.feijoes >= 10) {
            // Deduzir 10 feijões
            userData.feijoes -= 10;

            // Obter os números selecionados pelo utilizador a partir do corpo da requisição
            const numerosSelecionados = [];
            for (let i = 1; i <= 50; i++) {
                if (req.body[`num_${i}`]) {
                    numerosSelecionados.push(i);
                }
            }

            // Verificar se o utilizador selecionou exatamente 6 números, se não, o botão nao funciona
            if (numerosSelecionados.length !== 6) {
                return;
            }

            // Simular números sorteados (gerar aleatoriamente para este exemplo)
            const numerosSorteados = [];
            for (let i = 0; i < 6; i++) {
                const numeroSorteado = Math.floor(Math.random() * 50) + 1; // Gerar número aleatório entre 1 e 50
                numerosSorteados.push(numeroSorteado);
            }
            numerosSorteados.sort((a, b) => a - b);


            // Calcular quantos números o utilizador acertou
            const numAcertos = numerosSelecionados.filter(numero => numerosSorteados.includes(numero)).length;

            // Consultar a tabela de prêmios para determinar quantos feijões o utilizador ganhou
            const tabelaPremios = {
                1: 5,
                2: 10,
                3: 20,
                4: 50,
                5: 100,
                6: 1000
            };
            const feijoesGanhos = tabelaPremios[numAcertos] || 0;

            // Adicionar os feijões ganhos à conta do utilizador
            userData.feijoes += feijoesGanhos;

            // Atualizar os registros com os novos dados do utilizador
            try {
                fs.writeFileSync('registos.json', JSON.stringify(registos));
            } catch (error) {
                console.error('erro ao guardar dados no arquivo:', error);
            }

            // Redirecionar para uma rota que exibe os resultados da aposta
            res.redirect(`/resultados_aposta?acertos=${numAcertos}&feijoes=${feijoesGanhos}&numerosSelecionados=${numerosSelecionados}&numerosSorteados=${numerosSorteados}`);
        } else {
            // Se o utilizador não tiver feijões suficientes, enviar mensagem de erro para o index
            var mensagem = 'Você não possui feijões suficientes para fazer uma aposta.';
            res.render('pages/index', { titulo: 'Loto Online', username: req.session.username, feijoes: userData.feijoes, mensagem: mensagem });
        }
    } else {
        // Se o utilizador não for encontrado nos registros, redirecionar para a página inicial
        res.redirect('/');
    }
});

servidor.get('/ranking', function (req, res) {
    // Ler os registros de utilizador do arquivo JSON
    var registos = [];
    try {
        registos = JSON.parse(fs.readFileSync('registos.json'));
        if (!Array.isArray(registos)) {
            console.error('ficheiro inexistente ou sem registos anteriores');
            registos = [];
        }
    } catch (error) {
        console.error('erro ao ler o arquivo de registros:', error);
        registos = [];
    }

    // Classificar os utilizador com base no número de feijões (ou outro critério, se aplicável)
    registos.sort((a, b) => b.feijoes - a.feijoes);

    // Renderizar a página de ranking e passar os dados classificados para o template
    res.render('pages/ranking', {usuarios: registos });
});

servidor.get('/resultados_aposta', function (req, res) {
    const { acertos, feijoes, numerosSelecionados, numerosSorteados } = req.query;

    const titulo = 'Resultados da Aposta';

    function getMatchingNumbers(selectedNumbers, drawnNumbers) {
        const selectedNumbersArray = selectedNumbers.split(',').map(Number);
        const drawnNumbersArray = drawnNumbers.split(',').map(Number);

        return selectedNumbersArray.filter(number => drawnNumbersArray.includes(number));
    }

    const matchingNumbers = getMatchingNumbers(numerosSelecionados, numerosSorteados);

    const numerosSelecionadosArray = numerosSelecionados.split(',').map(Number);
    const numerosSorteadosArray = numerosSorteados.split(',').map(Number);

    res.render('pages/resultados_aposta', { titulo: titulo, acertos: acertos, feijoes: feijoes, numerosSelecionados: numerosSelecionadosArray, numerosSorteados: numerosSorteadosArray, matchingNumbers: matchingNumbers });
});

// esta rota tem de ser a última a ser especificada
servidor.get('*', function (req, res) {
    var html = '';
    html += topo;
    html += '<h1>404 &ndash; page not found</h1>\n';
    html += '<p>por favor, verifique o endereço</p>\n';
    html += fundo;
    res.status(404).send(html);
});

// esta rota, a par com a anterior, tem de ser a última a ser especificada
servidor.post('*', function (req, res) {
    var html = '';
    html += topo;
    html += '<h1>404 &ndash; page not found</h1>\n';
    html += '<p>por favor, verifique o endereço</p>\n';
    html += fundo;
    res.status(404).send(html);
});