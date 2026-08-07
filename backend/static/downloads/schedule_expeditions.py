#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Agenda os posts das 15 expedições 30S no APT (AutoPost Tabajara).

Como usar:
    python3 schedule_expeditions.py

Ele vai pedir a senha do site (a mesma que você usa pra entrar no APT).
A senha é digitada por VOCÊ, direto no terminal — nunca fica salva em
nenhum arquivo nem é vista por mim.
"""

import base64
import getpass
import io
import sys
from datetime import datetime, timedelta

import requests
from PIL import Image

# ---------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------
BASE_URL = "https://apt.30s.world"
FOTOS_DIR = "/Users/ricardomaluf/Desktop/Fotos Unsplash - 30S"
IG_USERNAME = "30s_explorers_club"
WINDOW_START_HOUR = 8
WINDOW_END_HOUR = 22
GAP_WITHIN_EXPEDICAO = timedelta(minutes=2)
GAP_ENTRE_EXPEDICOES = timedelta(hours=3)
SIMULTANEAS = 3  # primeiras N expedições sem o gap de 3h

# ---------------------------------------------------------------
# DADOS (extraídos de 30S_Expedicoes_Posts_Instagram.numbers)
# ---------------------------------------------------------------
EXPEDICOES = [
    dict(nome="Abbeys & Ales",
         t1="ABBEYS & ALES — o papel dos mosteiros na história da Europa. Uma expedição de 8 dias pela Bélgica — Bruxelas, Bruges, Ghent e as grandes abadias trapistas — pra entender como os mosteiros preservaram a civilização europeia. A cerveja é o ponto de partida; 1.500 anos de história são o destino. Não precisa ser entusiasta de cerveja: precisa ter curiosidade.",
         t2="Existe um silêncio que só as abadias têm. Caminhar pelas ruínas de Orval no fim da tarde, provar uma Chimay a poucos metros de onde ela nasce, ouvir o sino de Westmalle marcar as horas como há oito séculos. As abadias medievais preservaram o conhecimento — e as cervejas preservaram as abadias. Você vai voltar entendendo as duas.",
         t3="ABBEYS & ALES · Bélgica · 8 dias · máx. 6 pessoas\nPróxima saída: 12–19 de junho de 2028\nRoteiro: Bruxelas, Bruges, Ghent e as abadias trapistas (Westmalle, Chimay e Orval)\nInclui: transporte premium, 7 noites de hospedagem, café da manhã diário, visitas a 3 abadias trapistas com degustação, acompanhamento em português, álbum de fotos e seguro viagem\nNão inclui: aéreo, refeições (exceto café) e despesas pessoais\nA partir de €2.800 por pessoa\nVagas e outras datas: link na bio",
         f1="matthieu-joannon-h3nVbAtszTA-unsplash.jpg", f2="Abbeys 1x1.png", f3="francois-genon-f5cgAuS_d6g-unsplash.jpg",
         hashtags="#30SExplorersClub #AbbeysAndAles #Bélgica #CervejaTrapista #TurismoCultural #ViagemEmGrupo",
         local="Grand-Place, Bruxelas"),
    dict(nome="Al-Andalus",
         t1="AL-ANDALUS — oito séculos de herança islâmica na Ibéria. Entre 711 e 1492, floresceu na Península Ibérica uma das civilizações mais sofisticadas da história. Esta expedição de 10 dias percorre Sevilha, Córdoba, Ronda, Granada e Málaga pra entender essa herança — e o que ela significa pra identidade europeia. Não precisa saber nada do tema de antemão. Só ter interesse por história e cultura.",
         t2="Tem um momento em que a ficha cai: você está sob os arcos vermelhos e brancos da Mesquita de Córdoba, ou no Pátio dos Leões da Alhambra, e percebe que aquilo não é cenário — é o registro em pedra de oito séculos de ciência, poesia e convivência. Ver o entardecer do Mirador de San Nicolás, com a Alhambra dourada à frente e a Sierra Nevada atrás, é o tipo de memória que não volta pra casa: fica morando em você. ✨",
         t3="AL-ANDALUS · Espanha · 10 dias · máx. 6 pessoas\nPróxima saída: 3–12 de abril de 2028\nRoteiro: Sevilha, Córdoba, Medina Azahara, Ronda, Granada e Málaga\nInclui: transporte premium, 9 noites de hospedagem, café da manhã diário, entrada garantida na Alhambra, acompanhamento em português, álbum de fotos e seguro viagem\nNão inclui: aéreo, refeições (exceto café) e despesas pessoais\nA partir de €2.900 por pessoa\nVagas e outras datas: link na bio",
         f1="david-vives-gM1lnTTdWuE-unsplash.jpg", f2="Al-Andalus 1x1.png", f3="alexandra-tran-rvE_jTiejVc-unsplash.jpg",
         hashtags="#30SExplorersClub #AlAndalus #Alhambra #Andaluzia #Espanha #TurismoCultural",
         local="Alhambra, Granada"),
    dict(nome="Caminhos de Cervantes",
         t1="CAMINHOS DE CERVANTES — a Espanha vista através de Dom Quixote. Publicado em 1605, é o livro mais lido depois da Bíblia. Em 8 dias, percorremos os lugares onde Cervantes viveu e encontrou seus personagens — os moinhos de La Mancha, Toledo e os caminhos do Século de Ouro — usando a literatura como chave pra entender a Espanha. Não precisa ter lido o livro. Precisa ter curiosidade sobre como uma história define um país.",
         t2="Imagine chegar aos moinhos de Consuegra no fim da tarde, quando o céu fica cor de cobre e os 'gigantes' de Dom Quixote projetam sombras compridas na planície. Depois, Toledo ao entardecer: a cidade das três culturas, onde cristãos, mouros e judeus viveram muro com muro. Viajar com um livro como bússola muda o jeito de olhar — cada esquina vira página.",
         t3="CAMINHOS DE CERVANTES · Espanha · 8 dias · máx. 6 pessoas\nPróxima saída: 20–27 de março de 2028\nRoteiro: os lugares de Cervantes, os moinhos de La Mancha (Consuegra) e Toledo\nInclui: transporte premium, 7 noites de hospedagem, café da manhã diário, entradas em museus e monumentos, acompanhamento em português, álbum de fotos e seguro viagem\nNão inclui: aéreo, refeições (exceto café) e despesas pessoais\nA partir de €2.600 por pessoa\nVagas e outras datas: link na bio",
         f1="enrique-jimenez-k7I-Ci7Sq7c-unsplash.jpg", f2="Cervantes 1x1.png", f3="greta-scholderle-moller-FOc1dAPuCIU-unsplash.jpg",
         hashtags="#30SExplorersClub #CaminhosDeCervantes #DomQuixote #Toledo #Espanha #LiteraturaEViagem",
         local="Consuegra — Moinhos de Dom Quixote"),
    dict(nome="Celtic Myths & Whisky",
         t1="CELTIC MYTHS & WHISKY — uma jornada completa pela Escócia do whisky. De Edimburgo às Highlands, de Skye a Islay, passando por Speyside e Glasgow: 13 dias usando o whisky como fio condutor pra entender a Escócia — geografia, economia, lendas e resistência. Não precisa gostar de whisky: quem não bebe aproveita toda a história e a paisagem igual.",
         t2="Sentir o aroma de fumaça e salmoura no ar de Islay. Provar um single malt na destilaria, em Speyside, a metros dos barris onde ele dormiu por 15 anos. Dirigir por Skye com o Old Man of Storr aparecendo na neblina — e ouvir uma lenda celta contada no lugar exato onde ela nasceu. A Escócia não se explica: se prova. 🥃",
         t3="CELTIC MYTHS & WHISKY · Escócia · 13 dias · máx. 6 pessoas\nPróxima saída: 16–28 de agosto de 2027\nRoteiro: Edimburgo, Highlands, Ilha de Skye, Islay, Speyside e Glasgow\nInclui: 12 noites de hospedagem, café da manhã diário, van VIP exclusiva, degustações em todas as destilarias, ferry pra Islay, ingressos ao Castelo de Edimburgo, acompanhamento em português, álbum de fotos e seguro viagem\nNão inclui: aéreo, refeições (exceto café) e compras em destilarias\nA partir de £4.400 por pessoa (quarto duplo)\nVagas e outras datas: link na bio",
         f1="bree-anne-CmL4qgdXTsE-unsplash.jpg", f2="Celtic Myths 1x1.png", f3="sheng-l-3GUlwloYk0U-unsplash.jpg",
         hashtags="#30SExplorersClub #CelticMythsWhisky #Escócia #Whisky #Highlands #IlhaDeSkye",
         local="Castelo de Eilean Donan, Highlands"),
    dict(nome="Escandinavia Boreal",
         t1="ESCANDINÁVIA BOREAL — Islândia, Ártico e os povos do extremo norte. Da Islândia vulcânica ao Ártico norueguês, até Inari, coração da cultura Sami — um povo que vive nessas latitudes há mais de 10.000 anos. São 13 dias onde o frio não é obstáculo: é o que moldou a paisagem, as pessoas e a espiritualidade da região. Pra quem busca natureza extrema com profundidade cultural.",
         t2="Dormir num quarto feito inteiramente de gelo, a -5°C, dentro de um saco de dormir ártico. Atravessar a pé o limite entre duas placas tectônicas. Sentir os huskies puxarem o trenó na floresta silenciosa da Lapônia — e, se o céu permitir, ver a aurora dançar em verde sobre a sua cabeça. Há viagens que a gente conta. Esta, a gente sente no corpo.",
         t3="ESCANDINÁVIA BOREAL · Islândia · Noruega · Finlândia · 13 dias · máx. 6 pessoas\nPróxima saída: 15–27 de novembro de 2027\nRoteiro: Islândia (Círculo de Ouro e Blue Lagoon), Tromsø no Ártico norueguês e Lapônia finlandesa (Inari)\nInclui: veículo 4x4 na Islândia, 12 noites (incl. 1 no Ice Hotel), café da manhã diário, voo Keflavík→Tromsø, trenó com huskies, entrada na Blue Lagoon, acompanhamento em português, álbum de fotos e seguro viagem\nNão inclui: aéreo internacional, refeições (exceto café) e despesas pessoais\nA partir de €5.900 por pessoa\nVagas e outras datas: link na bio",
         f1="shepherd-dk3lO9WbqbQ-unsplash.jpg", f2="Escandinavia 1x1.png", f3="dee-Jl0zxk2MrUM-unsplash.jpg",
         hashtags="#30SExplorersClub #EscandinaviaBoreal #AuroraBoreal #Lapônia #Ártico #IceHotel",
         local="Tromsø, Noruega"),
    dict(nome="Espanha Medieval",
         t1="ESPANHA MEDIEVAL — castelos, catedrais e a alma de Castela. De Barcelona a Valência, passando por Girona, Besalú, Cardona, Albarracín, Toledo, Ávila, Segóvia e Montserrat: 12 dias em que cada cidade é um capítulo da formação da Espanha, contado por castelos, muralhas e antigos reinos. Pra quem quer entender a Espanha além das praias — da Reconquista à unificação ibérica.",
         t2="Subir a uma fortaleza erguida sobre uma montanha de sal. Caminhar por Albarracín, a vila vermelha abraçada por um rio e uma muralha que escala a montanha. Ficar diante do Alcázar de Segóvia — sim, o que inspirou o castelo da Disney — e perceber que a realidade veio primeiro, e é melhor. 🏰 Cada castelo guarda uma história; juntos, eles contam um país inteiro.",
         t3="ESPANHA MEDIEVAL · Espanha · 12 dias · máx. 6 pessoas\nPróxima saída: 17–28 de abril de 2028\nRoteiro: Barcelona, Girona, Besalú, Cardona, Albarracín, Toledo, Ávila, Segóvia, Valência e Montserrat\nInclui: transporte premium, 11 noites em hotéis boutique/históricos, café da manhã diário, todas as entradas em castelos e monumentos, acompanhamento em português, álbum de fotos e seguro viagem\nNão inclui: aéreo, refeições (exceto café), despesas pessoais e gorjetas\nA partir de €3.150 por pessoa\nVagas e outras datas: link na bio",
         f1="hasmik-ghazaryan-olson-jUGqWReweQw-unsplash.jpg", f2="Medieval 1x1.png", f3="logan-armstrong-hVhfqhDYciU-unsplash.jpg",
         hashtags="#30SExplorersClub #EspanhaMedieval #Castelos #Segóvia #Albarracín #HistóriaMedieval",
         local="Alcázar de Segóvia"),
    dict(nome="Fab Four Tour",
         t1="FAB FOUR TOUR — uma banda pode contar a história da Inglaterra. Liverpool, 1960: quatro rapazes de bairros operários começam a tocar em porões. Uma década depois, mudaram a cultura ocidental pra sempre. Esta expedição de 8 dias usa os Beatles como lente pra entender a Inglaterra — história industrial, crise pós-guerra e renascimento cultural. Não precisa ser fã. Precisa ser curioso.",
         t2="Atravessar a faixa de pedestres mais fotografada do mundo. Descer ao porão do Cavern Club, onde eles tocaram 292 vezes antes de o mundo saber quem eram. Caminhar pela Liverpool operária que formou os quatro — e pela Londres que eles ajudaram a reinventar. Tem uma trilha sonora pra essa viagem. Você já sabe de cor.",
         t3="FAB FOUR TOUR · Inglaterra · 8 dias · máx. 6 pessoas\nPróxima saída: 30 de agosto a 9 de setembro de 2027\nRoteiro: Liverpool (Cavern Club, Museu dos Beatles) e Londres (Abbey Road, Swinging London)\nInclui: aéreo internacional GRU↔Londres, transporte premium, 7 noites de hospedagem, café da manhã diário, Museu dos Beatles + Abbey Road, acompanhamento em português, álbum de fotos e seguro viagem\nNão inclui: refeições (exceto café) e despesas pessoais\nA partir de £4.350 por pessoa\nVagas e outras datas: link na bio",
         f1="ij-portwine-8d2jmS73Oz8-unsplash.jpg", f2="Fab Four Tour 1x1.png", f3="sasha-freemind-e_YlUfX0iKY-unsplash.jpg",
         hashtags="#30SExplorersClub #FabFourTour #Beatles #Liverpool #AbbeyRoad #Inglaterra",
         local="Cavern Club, Liverpool"),
    dict(nome="La Dolce Vite",
         t1="LA DOLCE VITE — a Itália contada pela arte, pela história e pela mesa. De Roma a Florença, pela Toscana, San Gimignano e o Vale d'Orcia: 12 dias entendendo as camadas que tornam a Itália singular — Império Romano, Renascimento e uma unificação tardia que criou uma nação diversíssima. Vinho e gastronomia entram como expressão cultural, não como atração à parte.",
         t2="Ficar diante do Davi de Michelangelo depois de entender quem financiou o Renascimento — e por quê. Provar um Brunello direto da vinícola, em Montalcino. 🍷 Ver o Vale d'Orcia, a paisagem que parece pintada por um renascentista porque literalmente foi. A Itália não é um país: é uma civilização. Esta expedição ensina a lê-la.",
         t3="LA DOLCE VITE · Itália · 12 dias · máx. 6 pessoas\nPróxima saída: 15 de maio de 2028\nRoteiro: Roma, Florença, Toscana (San Gimignano, Montepulciano e Montalcino) e Vale d'Orcia\nInclui: transporte premium, 11 noites de hospedagem, café da manhã diário, entradas em museus, degustações em Montepulciano e Montalcino, acompanhamento em português, álbum de fotos e seguro viagem\nNão inclui: aéreo, refeições (exceto café) e despesas pessoais\nA partir de €3.650 por pessoa\nVagas e outras datas: link na bio",
         f1="yilei-jerry-bao-pqnwktBGynI-unsplash.jpg", f2="La Dolce 1x1.png", f3="spencer-davis-ckotRXopwRM-unsplash.jpg",
         hashtags="#30SExplorersClub #LaDolceVite #Itália #Toscana #Renascimento #Florença",
         local="Florença, Itália"),
    dict(nome="Pop Nórdico",
         t1="POP NÓRDICO — ABBA, Roxette e a Suécia que conquistou o mundo. A Suécia produziu, per capita, mais sucesso musical internacional que qualquer país além de EUA e Reino Unido. São 9 dias entre Estocolmo, Halmstad e Gotemburgo pra entender o modelo cultural por trás do fenômeno — do ABBA a Max Martin. Não precisa ser fã. Precisa ter curiosidade sobre como um país pequeno virou potência cultural.",
         t2="Entrar no museu do ABBA cantando 'Waterloo' baixinho. Caminhar pela Halmstad de Per Gessle e Marie Fredriksson, ver o mar que inspirou baladas que você ouviu a vida inteira, garimpar vinil na maior loja de discos da Escandinávia. Toda geração tem sua trilha sonora — nesta viagem, você descobre onde a sua foi gravada.",
         t3="POP NÓRDICO · Suécia · 9 dias · máx. 6 pessoas\nPróxima saída: 1–9 de novembro de 2027\nRoteiro: Estocolmo, Halmstad e Gotemburgo\nInclui: transporte premium, 8 noites de hospedagem, café da manhã diário, ingresso antecipado ao ABBA The Museum, trem entre as 3 cidades, acompanhamento em português, álbum de fotos e seguro viagem\nNão inclui: aéreo internacional, refeições (exceto café) e despesas pessoais\nA partir de €3.500 por pessoa\nVagas e outras datas: link na bio",
         f1="sadia-afreen-O49oWJUdrgU-unsplash.jpg", f2="Pop Nordico 1x1.png", f3="howen-bo8XlhXNrE8-unsplash.jpg",
         hashtags="#30SExplorersClub #PopNordico #ABBA #Roxette #Estocolmo #Suécia",
         local="ABBA The Museum, Estocolmo"),
    dict(nome="Reinos Dourados",
         t1="REINOS DOURADOS — templos dourados, praias de esmeralda e os elefantes do norte. De Bangkok a Chiang Mai, das praias do Mar de Andamão às ruínas de Angkor, no Camboja: 13 dias entre reinos, religiões e paisagens do Sudeste Asiático. Do budismo vivo das ruas ao silêncio dos templos abandonados — história, espiritualidade e natureza num só roteiro.",
         t2="Ver as cinco torres de Angkor Wat emergirem da água ao amanhecer. Observar elefantes livres, sem montaria, num santuário ético no norte da Tailândia. 🐘 Navegar entre as falésias de calcário de Railay num mar verde-esmeralda. Tem lugares que a gente visita — e lugares que reorganizam por dentro o nosso jeito de ver o mundo.",
         t3="REINOS DOURADOS · Tailândia · Camboja · 13 dias · máx. 6 pessoas\nPróxima saída: 17–29 de janeiro de 2028\nRoteiro: Bangkok, Chiang Mai, praias do Mar de Andamão (Railay e Phi Phi) e Angkor, no Camboja\nInclui: 12 noites em hotéis boutique, café da manhã diário, voos internos, santuário ético de elefantes, passe de Angkor, passeio de barco em Phi Phi, acompanhamento em português, álbum de fotos e seguro viagem\nNão inclui: aéreo internacional, refeições (exceto café), e-visa do Camboja, gorjetas e despesas pessoais\nA partir de €4.900 por pessoa\nVagas e outras datas: link na bio",
         f1="haley-hong-MKVGJ4d3E6c-unsplash.jpg", f2="Reinos Dourados 1x1.png", f3="jared-rice-Tm0XygW6gN8-unsplash.jpg",
         hashtags="#30SExplorersClub #ReinosDourados #Tailândia #Camboja #AngkorWat #SudesteAsiático",
         local="Angkor Wat, Camboja"),
    dict(nome="Rota da Transilvânia",
         t1="ROTA DA TRANSILVÂNIA — castelos, Drácula e o coração dos Bálcãs. De Bucareste aos Cárpatos, por Brasov, Sighisoara e as aldeias saxônicas, até Sofia, na Bulgária: 10 dias pelo interior mais desconhecido da Europa, onde Vlad Tepes, Bram Stoker e a história real se cruzam de um jeito que nenhum guia costuma explicar. Pra quem curte história, castelos e um bom mito bem desmontado.",
         t2="Entrar no Castelo de Bran — o 'Castelo de Drácula' — e descobrir que a história real é melhor que o mito. Caminhar pelos becos de Sighisoara, a única cidadela medieval ainda habitada da Europa, na hora em que os lampiões acendem. Ver os Cárpatos em chamas de outono ao redor de Peles. A Transilvânia não é lenda: é um lugar — e impressiona mais de perto.",
         t3="ROTA DA TRANSILVÂNIA · Romênia · Bulgária · 10 dias · máx. 6 pessoas\nPróxima saída: 18–27 de outubro de 2027\nRoteiro: Bucareste, Cárpatos (Peles e Bran), Brasov, Sighisoara, aldeias saxônicas e Sofia\nInclui: transporte premium, 9 noites de hospedagem, café da manhã diário, ingressos a Peles, Bran, Sighisoara e Mosteiro de Rila, travessia de fronteira, acompanhamento em português, álbum de fotos e seguro viagem\nNão inclui: aéreo internacional, refeições (exceto café) e despesas pessoais\nA partir de €2.900 por pessoa\nVagas e outras datas: link na bio",
         f1="virgil-maierean-8A496IhZ47A-unsplash.jpg", f2="Transilvania 1x1.png", f3="gloria-cretu-k4Tt_q7CM7g-unsplash.jpg",
         hashtags="#30SExplorersClub #RotaDaTransilvania #Drácula #CasteloDeBran #Romênia #LesteEuropeu",
         local="Castelo de Bran, Transilvânia"),
    dict(nome="Route des Vins",
         t1="ROUTE DES VINS — a França contada através de suas regiões vinícolas. O vinho francês não é só uma bebida: é uma forma de organizar o território e registrar séculos de história. São 15 dias e 2.400 km partindo de Paris por Champagne, Alsácia, Borgonha, Beaujolais, Bordeaux e Cognac. Não precisa entender de vinho — a expedição é construída pra quem quer aprender. Quem não bebe aproveita o conteúdo histórico plenamente.",
         t2="Descer às caves de Épernay, com 200 milhões de garrafas envelhecendo sob os seus pés. Brindar na Alsácia entre casas de enxaimel, conhecer os Hospices de Beaune — um hospital medieval financiado por leilões de vinho — e terminar em Cognac. 🥂 Um vinho pode contar a história da França inteira. Esta expedição prova isso, taça a taça.",
         t3="ROUTE DES VINS · França · 15 dias · máx. 6 pessoas\nPróxima saída: 27 de setembro a 11 de outubro de 2027\nRoteiro: Paris, Champagne (Épernay), Alsácia, Borgonha (Beaune), Beaujolais, Bordeaux e Cognac\nInclui: transporte premium, 14 noites de hospedagem, café da manhã diário, degustações em cada região, acompanhamento em português, álbum de fotos e seguro viagem\nNão inclui: aéreo, refeições (exceto café), compras em vinícolas e despesas pessoais\nA partir de €4.650 por pessoa\nVagas e outras datas: link na bio",
         f1="carnet-de-voyage-d-alex-xPWTj-lCzGQ-unsplash.jpg", f2="Route des Vins 1x1.png", f3="thomas-dorgler-xi170XoT-uo-unsplash.jpg",
         hashtags="#30SExplorersClub #RouteDesVins #França #Enoturismo #Champagne #Borgonha",
         local="Épernay — Avenue de Champagne"),
    dict(nome="Sombra da Guerra",
         t1="A SOMBRA DA GUERRA — Normandia, Nuremberg e Berlim. Das praias do Dia D ao Memorial do Holocausto, passando por Dachau e pela Sala 600, onde a história julgou seus responsáveis: 11 dias pra entender o século que ainda molda o nosso. Uma expedição conscientemente pesada, conduzida com o respeito que os locais exigem. Pra quem busca entender — não turismo leve.",
         t2="Caminhar por Omaha Beach ao amanhecer, no silêncio da maré baixa. Ficar diante das 9.387 cruzes brancas de Colleville-sur-Mer e entender, uma a uma, o que elas custaram. A Guerra acabou há mais de oitenta anos — mas os campos ainda falam. Nesta expedição, há espaço pra silêncio e pra perguntas sem resposta fácil. E é exatamente por isso que ela transforma.",
         t3="A SOMBRA DA GUERRA · França · Alemanha · 11 dias · máx. 8 pessoas\nPróxima saída: 29 de maio a 8 de junho de 2028\nRoteiro: Normandia (praias do Dia D e Memorial de Caen), Munique/Dachau, Nuremberg (Sala 600) e Berlim\nInclui: transporte premium, 10 noites de hospedagem, café da manhã diário, voo Paris→Munique, ingressos ao Memorial de Caen, Dachau e Sala 600, acompanhamento em português, álbum de fotos e seguro viagem\nNão inclui: aéreo internacional, refeições (exceto café) e despesas pessoais\nA partir de €3.500 por pessoa\nVagas e outras datas: link na bio",
         f1="datingjungle-8awEqnZDF80-unsplash.jpg", f2="Guerra 1x1.png", f3="bruna-santos-tMP8hJK-rrs-unsplash.jpg",
         hashtags="#30SExplorersClub #ASombraDaGuerra #Normandia #SegundaGuerraMundial #HistóriaEMemória #Berlim",
         local="Omaha Beach, Normandia"),
    dict(nome="Terra do Gelo e do Fogo",
         t1="TERRA DO GELO E DO FOGO — Islândia: glaciares, vulcões e o limite do mundo habitável. Do Círculo de Ouro às cavernas de gelo do Vatnajökull, são 8 dias pela Rota Sul do país que fundou a primeira democracia parlamentar do mundo, em 930 d.C. Pra quem quer imersão intensa em paisagem extrema, sem abrir mão do conforto.",
         t2="Entrar numa caverna de gelo azul translúcido, formada por milênios de compressão. 🧊 Ver icebergs encalhados numa praia de areia negra que brilha como diamante. Sentir o chão vibrar quando o gêiser Strokkur explode a metros de você. A Islândia existe na dobra entre dois mundos — e você atravessa esse limite a pé.",
         t3="TERRA DO GELO E DO FOGO · Islândia · 8 dias · máx. 8 pessoas\nPróxima saída: 31 de janeiro a 7 de fevereiro de 2028\nRoteiro: Rota Sul — Círculo de Ouro, cachoeiras, praias de areia negra, Jökulsárlón e cavernas de gelo do Vatnajökull\nInclui: veículo 4x4, 7 noites de hospedagem, café da manhã diário, tour à caverna de gelo com equipamento completo, acompanhamento em português, álbum de fotos e seguro viagem\nNão inclui: aéreo internacional, refeições (exceto café) e despesas pessoais\nA partir de €2.900 por pessoa\nVagas e outras datas: link na bio",
         f1="colin-watts-pR-5gi-hB1c-unsplash.jpg", f2="Terra do Gelo 1x1.png", f3="dylan-whoriskey-zDNjMZhQXnM-unsplash.jpg",
         hashtags="#30SExplorersClub #TerraDoGeloEDoFogo #Islândia #Vatnajökull #DiamondBeach #Natureza",
         local="Diamond Beach (Jökulsárlón), Islândia"),
    dict(nome="Vinhos e Reinos",
         t1="VINHOS E REINOS — a Península Ibérica contada por seus vinhos. Em duas etapas — primeiro a Espanha, de Zaragoza a Barcelona; depois Portugal, do Porto a Lisboa — esta expedição de 13 dias usa o vinho como instrumento pra compreender séculos de história ibérica compartilhada. Dois países, um só fio condutor. Quem não bebe aproveita o conteúdo histórico plenamente.",
         t2="Caminhar entre vinhas plantadas por monges cartuxos no século XII, no Priorat. Descer aos armazéns centenários do Vinho do Porto em Vila Nova de Gaia, com o cheiro de madeira e tempo no ar. Ver o Douro — talvez o rio mais bonito da Europa — dos terraços de uma quinta. A Península Ibérica não é unida por fronteiras. É unida por vinhas centenárias.",
         t3="VINHOS E REINOS · Espanha · Portugal · 13 dias · máx. 6 pessoas\nPróxima saída: 13–25 de setembro de 2027\nRoteiro: Zaragoza, Priorat e Barcelona → Porto, Vale do Douro e Lisboa\nInclui: transporte premium nos 2 países, voo Barcelona→Porto, 12 noites de hospedagem, café da manhã diário, degustações inclusas, acompanhamento em português, álbum de fotos e seguro viagem\nNão inclui: aéreo internacional, refeições (exceto café), compras em vinícolas e despesas pessoais\nA partir de €3.900 por pessoa\nVagas e outras datas: link na bio",
         f1="martti-salmi-DIlNnsnDC7U-unsplash.jpg", f2="Vinhos e Reinos 1x1.png", f3="jordi-vich-navarro-6ESXKKZnBfk-unsplash.jpg",
         hashtags="#30SExplorersClub #VinhosEReinos #Douro #Porto #Espanha #Portugal",
         local="Ribeira do Porto, Portugal"),
]


# ---------------------------------------------------------------
# PROCESSAMENTO DE IMAGEM: crop quadrado + acerto de tom p/ combinar com a capa
# ---------------------------------------------------------------
def avg_rgb(img):
    small = img.resize((60, 60))
    px = list(small.getdata())
    n = len(px)
    r = sum(p[0] for p in px) / n
    g = sum(p[1] for p in px) / n
    b = sum(p[2] for p in px) / n
    return r, g, b


def center_crop_square(img):
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return img.crop((left, top, left + side, top + side))


def color_match(img, target_avg, size, strength=0.35):
    """Aproxima a tonalidade média de `img` da tonalidade de `target_avg`,
    de forma sutil (strength = 0 a 1) pra não estourar a foto."""
    img = center_crop_square(img).resize((size, size), Image.LANCZOS).convert("RGB")
    src_avg = avg_rgb(img)
    gains = []
    for s, t in zip(src_avg, target_avg):
        gain = (t / s) if s > 1 else 1.0
        gain = 1 + (gain - 1) * strength
        gain = max(0.85, min(1.2, gain))
        gains.append(gain)

    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            px[x, y] = (
                min(255, int(r * gains[0])),
                min(255, int(g * gains[1])),
                min(255, int(b * gains[2])),
            )
    return img


def process_pair(folder, f1, f2, f3):
    capa = Image.open(f"{folder}/{f2}").convert("RGB")
    size = capa.size[0]
    target = avg_rgb(capa)

    raw1 = Image.open(f"{folder}/{f1}")
    raw3 = Image.open(f"{folder}/{f3}")
    img1 = color_match(raw1, target, size)
    img3 = color_match(raw3, target, size)
    return img1, capa, img3


def to_data_url(img):
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/jpeg;base64,{b64}"


# ---------------------------------------------------------------
# AGENDAMENTO DE HORÁRIOS
# ---------------------------------------------------------------
def clamp_to_window(dt):
    if dt.hour < WINDOW_START_HOUR:
        return dt.replace(hour=WINDOW_START_HOUR, minute=0, second=0, microsecond=0)
    if dt.hour >= WINDOW_END_HOUR:
        nxt = dt + timedelta(days=1)
        return nxt.replace(hour=WINDOW_START_HOUR, minute=0, second=0, microsecond=0)
    return dt


def build_schedule(n_expedicoes):
    cursor = clamp_to_window(datetime.now())
    schedule = []  # lista de listas de 3 datetimes, por expedição
    for i in range(n_expedicoes):
        if i >= SIMULTANEAS:
            cursor = clamp_to_window(cursor + GAP_ENTRE_EXPEDICOES)
        times = []
        for _ in range(3):
            cursor = clamp_to_window(cursor)
            times.append(cursor)
            cursor = cursor + GAP_WITHIN_EXPEDICAO
        schedule.append(times)
    return schedule


# ---------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------
def main():
    print(f"Login em {BASE_URL} ...")
    senha = getpass.getpass("Senha do APT: ")

    sess = requests.Session()
    r = sess.post(f"{BASE_URL}/api/login", json={"password": senha}, timeout=15)
    if r.status_code != 200 or not r.json().get("success", True):
        print("Falha no login:", r.status_code, r.text[:300])
        sys.exit(1)
    print("Login OK.")

    r = sess.get(f"{BASE_URL}/api/instagram/status", timeout=15)
    accounts = r.json().get("accounts", [])
    acct = next((a for a in accounts if a.get("username") == IG_USERNAME), None)
    if not acct:
        print(f"Conta @{IG_USERNAME} não encontrada. Contas disponíveis:")
        for a in accounts:
            print(" -", a.get("username"))
        sys.exit(1)
    ig_account_id = acct["id"]
    print(f"Conta @{IG_USERNAME} encontrada (id={ig_account_id}).")

    schedule = build_schedule(len(EXPEDICOES))

    total_ok, total_err = 0, 0
    for exp, times in zip(EXPEDICOES, schedule):
        print(f"\n=== {exp['nome']} ===")
        try:
            img1, img2, img3 = process_pair(
                f"{FOTOS_DIR}/{exp['nome']}", exp["f1"], exp["f2"], exp["f3"]
            )
        except Exception as e:
            print(f"  ERRO ao processar imagens: {e}")
            total_err += 3
            continue

        # ordem de postagem: foto3 (mais antiga) -> foto2 (capa) -> foto1 (mais nova)
        posts = [
            (img3, exp["t3"], times[0]),
            (img2, exp["t2"], times[1]),
            (img1, exp["t1"], times[2]),
        ]

        for img, caption, when in posts:
            payload = {
                "photo": to_data_url(img),
                "caption": caption,
                "hashtags": [h.strip() for h in exp["hashtags"].split() if h.strip()],
                "location": exp["local"],
                "schedule_date": when.isoformat(),
                "post_type": "feed",
                "ig_account_id": ig_account_id,
            }
            try:
                resp = sess.post(f"{BASE_URL}/api/create-post", json=payload, timeout=60)
                ok = resp.status_code == 200 and resp.json().get("success")
                print(f"  {when.strftime('%d/%m %H:%M')} -> {'OK' if ok else 'ERRO'}"
                      + ("" if ok else f" ({resp.status_code}: {resp.text[:150]})"))
                if ok:
                    total_ok += 1
                else:
                    total_err += 1
            except Exception as e:
                print(f"  {when.strftime('%d/%m %H:%M')} -> ERRO ({e})")
                total_err += 1

    print(f"\nConcluído: {total_ok} agendados, {total_err} com erro.")


if __name__ == "__main__":
    main()
