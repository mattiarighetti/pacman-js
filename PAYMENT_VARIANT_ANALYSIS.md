# Analisi variante pagamenti per pacman-js

## Obiettivo

Questo documento riassume lo stato del repository e propone una variante del gioco ispirata a pagamenti elettronici, carte di credito, contactless, antifrode e reti di autorizzazione.

La variante deve partire dal gioco esistente senza stravolgere l'architettura: prima reskin e piccoli comportamenti, poi eventuali meccaniche nuove.

## Stato attuale del repository

`pacman-js` e un clone statico di Pac-Man costruito con:

- HTML per struttura della pagina e DOM atteso dal gioco.
- JavaScript plain per logica gameplay.
- SCSS per stili sorgente.
- Gulp per compilare SCSS e concatenare JavaScript.
- Mocha, Sinon e NYC per test e coverage.
- ESLint con configurazione Airbnb base.
- Husky per hook locali su lint e test.

Il browser carica `index.html`, che include `build/app.css` e `build/app.js`. I file in `build/` sono output generati, quindi le modifiche vanno fatte nei sorgenti sotto `app/`.

## Gestione asset

Gli asset sono file statici, non elementi generati a codice.

- Sprite e immagini: `app/style/graphics/`
- Sprite sheet: `app/style/graphics/spriteSheets/`
- Audio: `app/style/audio/`
- SCSS sorgente: `app/style/scss/`

Personaggi, pickup, testi e maze usano SVG/PNG come background CSS. L'animazione avviene spostando `background-position` sullo sprite sheet, tramite la logica condivisa in `CharacterUtil`.

Gli audio sono MP3 caricati da `SoundManager` e pre-caricati da `GameCoordinator.preloadAssets()`. La lista degli asset e hardcoded, quindi ogni nuovo asset deve essere aggiunto anche al preload quando serve prima del gameplay.

## Architettura gameplay

- `GameCoordinator`: orchestratore principale. Gestisce DOM, stato partita, punti ioSi, vite, livello, input, eventi, timer, collisioni, audio e transizioni.
- `GameEngine`: loop a timestep fisso. Chiama `update(elapsedMs)` e `draw(interp)` sulle entita.
- `Pacman`: movimento player, direzione desiderata, collisione con muri, warp tunnel, sprite e animazione morte.
- `Ghost`: AI fantasmi, target, modalita chase/scatter/scared/eyes, ghost house, velocita e collisione con Pac-Man.
- `Pickup`: pacdot, power pellet e frutta. Crea il proprio nodo DOM, gestisce visibilita, punti e collisione con Pac-Man.
- `CharacterUtil`: helper per griglia, movimento, snap, warp, velocita, stutter e avanzamento sprite.
- `Timer`: wrapper pausabile di `setTimeout`, integrato con eventi `addTimer` e `removeTimer`.
- `SoundManager`: effetti audio, ambience loop, volume master e suoni dot ottimizzati con Web Audio.

Le integrazioni tra moduli passano spesso da eventi browser su `window`, per esempio `awardPoints`, `dotEaten`, `powerUp`, `eatGhost` e `deathSequence`.

## Concept variante pagamenti

Tema: Pac-Man attraversa una rete di pagamenti. Le dot sono microtransazioni, i powerup sono autorizzazioni forti, i fantasmi rappresentano problemi del mondo payment.

Mappatura possibile:

- Pacdot: transazioni piccole o tap contactless.
- Power pellet: autorizzazione forte, SCA o antifrode temporanea.
- Frutta: bonus merchant o strumenti payment, come POS, carta premium, wallet, QR pay, token NFC.
- Vite: limite credito o tentativi autorizzazione.
- Sistema punti: `punti ioSi`, il saldo/reward guadagnato raccogliendo dot, bonus e azioni speciali.
- Level complete: settlement completato.
- Game over: transazione rifiutata.

Fantasmi tematici:

- Blinky: Fraud.
- Pinky: Chargeback.
- Inky: Timeout.
- Clyde: Declined.

Testi UI possibili:

- `1UP` -> `CARD`
- `HIGH SCORE` -> `PUNTI ioSi`
- `READY!` -> `AUTHORIZE`
- `GAME OVER` -> `DECLINED`

## Contact mode powerup

La meccanica principale proposta e una modalita contactless attivata da powerup.

Comportamento:

- Quando Pac-Man raccoglie un powerup dedicato, entra in `contact mode` per un tempo limitato.
- Durante `contact mode`, le dot vicine vengono raccolte automaticamente in un raggio intorno a Pac-Man.
- La raccolta automatica simula un tap contactless o una carta/wallet che autorizza pagamenti vicini.
- Il powerup non deve sostituire per forza l'attuale power pellet: puo essere una variante, oppure una nuova interpretazione del power pellet esistente.
- Il timer deve essere pausabile usando `Timer`, cosi la durata resta coerente quando il gioco va in pausa.

Parametri iniziali consigliati per MVP:

- Durata: 5 secondi.
- Raggio: 2 tile dal centro di Pac-Man.
- Effetto visuale: aura/contactless ring intorno a Pac-Man.
- Effetto audio: beep POS o chime di autorizzazione.
- Punti ioSi: stessi punti delle dot normali, con eventuale bonus combo separato in fase successiva.

## Scritte animate pop

La variante puo aggiungere scritte animate in stile arcade anni 80 quando il player raggiunge soglie punti ioSi o completa azioni particolari. Devono essere impattanti ma non invasive: testo breve, posizione vicino alla zona gameplay, durata ridotta e dimensione coerente con la UI pixel-art.

Obiettivo:

- Dare feedback immediato ai traguardi senza coprire labirinto, Pac-Man o fantasmi.
- Rinforzare il tema pagamenti con micro-messaggi chiari.
- Usare animazioni CSS leggere, non canvas o rendering custom.

Trigger consigliati:

- 1.000 punti ioSi: `Tap streak!`
- 2.500 punti ioSi: `Cashback ioSi!`
- 5.000 punti ioSi: `Authorization approved`
- 10.000 punti ioSi: `ioSi level up`
- Contact mode attivato: `Contactless boost`
- Quattro fantasmi mangiati in un powerup: `Fraud blocked`
- Livello completato: `Settlement complete`
- Soglia speciale `1337` punti ioSi: `Tokenized`

Linee guida visuali:

- Font coerente con `Press Start 2P`.
- Dimensione massima circa 1.5-2 tile di altezza, mai hero text.
- Colori accesi ma leggibili: giallo, cyan, verde approvazione, magenta come accento.
- Outline o text-shadow scuro per contrasto su maze blu.
- Durata 900-1400 ms.
- Animazione: scale da 0.75 a 1.1, breve bounce, fade out, leggero movimento verso l'alto.
- Una sola scritta primaria visibile alla volta; se arrivano piu trigger ravvicinati, mostrare il messaggio con priorita piu alta.

Priorita messaggi:

1. Eventi rari o speciali, come `Tokenized` e `Fraud blocked`.
2. Level complete e contact mode.
3. Milestone punti ioSi.
4. Combo minori.

Implementazione consigliata:

- Gestire soglie e messaggi in `GameCoordinator`, vicino alla logica `awardPoints`.
- Tenere una lista di milestone gia mostrate per evitare ripetizioni nello stesso run.
- Aggiungere un metodo dedicato, per esempio `displayPopMessage(message, variant)`, separato da `displayText` se il comportamento visuale e diverso dai testi sprite esistenti.
- Creare un elemento DOM overlay piccolo dentro `game-ui` o `maze`, con classe SCSS dedicata.
- Usare classi CSS per varianti tipo `approved`, `cashback`, `warning`, `special`.
- Rimuovere o resettare il nodo al termine dell'animazione con `animationend` o un `Timer` breve.
- Non bloccare gameplay, input o game loop: la scritta e feedback visuale passivo.

## Nexi Shop e shopping rush

Nel livello `Marketplace` puo comparire un riferimento al `Nexi Shop`: in un angolo del labirinto viene mostrato un carrello della spesa con logo dello shop. Interagendo con il carrello parte un micro-gioco temporaneo chiamato `shopping rush`.

Comportamento:

- Il carrello appare in un angolo sicuro del livello `Marketplace`, senza bloccare percorsi obbligati.
- Pac-Man interagisce toccando il carrello, come con un pickup speciale.
- All'avvio dello `shopping rush`, parte un timer di 10 secondi.
- Durante i 10 secondi compaiono pillole-prodotto nel labirinto.
- Ogni pillola-prodotto raccolta assegna un coupon sconto.
- Ogni coupon riduce la prossima penalita causata da un fantasma del 10%.
- I coupon possono accumularsi, ma per MVP conviene applicare un limite massimo del 50% sulla prossima penalita.
- Dopo l'applicazione della penalita ridotta, i coupon consumati vengono azzerati.

Uso nel tema pagamenti:

- Le pillole-prodotto rappresentano articoli aggiunti al carrello.
- Il coupon e un beneficio shop/reward collegato ai punti ioSi.
- La riduzione penalita trasforma il bonus in una protezione concreta senza rendere il player invulnerabile.

Feedback visuale consigliato:

- Scritta pop `Shopping rush!` all'avvio.
- Countdown piccolo vicino alla UI, non sopra il centro del maze.
- Scritta pop `Coupon -10%` a ogni prodotto raccolto.
- Scritta pop `Penalty reduced` quando un fantasma attiva la penalita ridotta.

## Idee gameplay

- Cashback combo: bonus se il player raccoglie molte dot senza morire o senza interrompere la sequenza.
- Anti-fraud mode: powerup che rende mangiabili i fantasmi e li rappresenta come frodi bloccate.
- Settlement streak: completare un livello senza perdere vite mostra "Settlement complete" e assegna bonus.
- Split payment: due bonus appaiono in punti diversi; prenderli entrambi entro un timer assegna extra punti ioSi.
- Offline POS mode: per pochi secondi si raccolgono punti ioSi "pending", poi vengono confermati tutti insieme.
- Decline zones: alcune aree richiedono un token o powerup prima di essere attraversate.
- Circuit rails: tunnel laterali interpretati come circuiti internazionali o reti di pagamento.

## Easter egg

- Sequenza tasti `NEXI`: abilita sprite o colore speciale a tema POS/contactless.
- Soglia `1337` punti ioSi: mostra messaggio `Tokenized`.
- Prima morte con zero punti ioSi: mostra `Insufficient funds`.
- Powerup riuscito: mostra `Authorization approved`.
- Raccogliere il bonus key: mostra `PCI vault unlocked`.
- Mangiare quattro fantasmi durante un solo powerup: mostra `Fraud engine trained`.
- Pausa lunga: mostra `Session expired`.
- Livello completato senza morti: mostra `Premium card holder`.

## MVP consigliato

Per una prima versione hackathon, conviene limitare il perimetro:

1. Reskin testuale di UI e messaggi principali.
2. Nuovi asset per pickup: POS, carta, wallet, QR, token contactless.
3. Rinomina concettuale dei fantasmi in frode, chargeback, timeout e declined.
4. Implementazione `contact mode` come powerup temporaneo.
5. Easter egg `NEXI` con effetto visivo leggero.
6. Scritte pop animate per milestone punti ioSi e azioni speciali.

Questo MVP dovrebbe toccare soprattutto `GameCoordinator`, `Pickup`, asset grafici/audio e SCSS. I test da aggiornare sarebbero mirati a eventi, collisioni pickup e durata del timer.

## Possibile implementazione futura

Questa sezione descrive l'approccio tecnico senza modificare ancora il codice.

- Aggiungere stato temporaneo in `GameCoordinator`, per esempio `contactModeActive`, `contactModeRadius` e `contactModeTimer`.
- Attivare lo stato quando viene raccolto il powerup contactless, usando un evento dedicato o estendendo il flusso `powerUp` esistente.
- Usare `Timer` per disattivare automaticamente la modalita, mantenendo compatibilita con pausa/ripresa.
- Estendere la logica di `Pickup` o il ciclo di prossimita per permettere raccolta automatica se una dot visibile entra nel raggio contactless.
- Mantenere i punti ioSi assegnati tramite evento `awardPoints`, cosi saldo corrente, record e display restano gestiti dal coordinatore.
- Aggiungere effetto visuale via classe CSS su Pac-Man o su un nuovo elemento aura, evitando canvas o rendering custom.
- Aggiungere un overlay testuale leggero per messaggi pop e pilotarlo da soglie punti ioSi/eventi speciali.
- Modellare il carrello Nexi Shop come pickup speciale, con stato `shoppingRushActive`, timer da 10 secondi e contatore coupon.
- Applicare i coupon nella gestione della penalita fantasma, riducendo solo la prossima penalita e poi resettando il bonus usato.
- Aggiornare preload asset se vengono introdotti nuovi sprite/audio usati durante il gioco.

## Note di rischio

- Molti path asset sono hardcoded: ogni rinomina deve aggiornare preload, CSS/JS e test che controllano URL esatti.
- La build concatena classi globali, quindi nuove classi browser devono rispettare il modello attuale e usare `module.exports` solo nel blocco rimosso in produzione.
- Collisioni e posizioni usano coordinate CSS e coordinate griglia con offset di mezzo tile; modifiche al raggio contactless devono essere validate in gioco reale.
- I test hanno coverage al 100%, quindi ogni ramo nuovo in `app/scripts/**/*.js` richiede copertura adeguata.

## Validazione prevista

Per questo documento non serve eseguire `npm test`, perche non cambia codice applicativo.

Validazioni utili:

- Markdown leggibile.
- Contenuto non duplicato rispetto ad `AGENTS.md`.
- `git status --short` mostra il nuovo documento non tracciato, insieme agli altri file gia non tracciati.
