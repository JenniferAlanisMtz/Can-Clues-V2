/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');

var persistenceAdapter = getPersistenceAdapter();
var estadoPartida = 0;
var pregunta = 0;
var desbug = "Funciona otra vezzzz"
var objetoUno
var objetoDos
var objetoTres
var pista;
var intentos = 0;

function getPersistenceAdapter() {
    // This function is an indirect way to detect if this is part of an Alexa-Hosted skill
    function isAlexaHosted() {
        return process.env.S3_PERSISTENCE_BUCKET ? true : false;
    }
    const tableName = 'can_clues_table';
    if(isAlexaHosted()) {
        const {S3PersistenceAdapter} = require('ask-sdk-s3-persistence-adapter');
        return new S3PersistenceAdapter({ 
            bucketName: process.env.S3_PERSISTENCE_BUCKET
        });
    } else {
        // IMPORTANT: don't forget to give DynamoDB access to the role you're to run this lambda (IAM)
        const {DynamoDbPersistenceAdapter} = require('ask-sdk-dynamodb-persistence-adapter');
        return new DynamoDbPersistenceAdapter({ 
            tableName: tableName,
            createTable: true
        });
    }
}

const LoadAttributesRequestInterceptor = {
    async process(handlerInput) {
        if(handlerInput.requestEnvelope.session['new']){ //is this a new session?
            const {attributesManager} = handlerInput;
            const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
            //copy persistent attribute to session attributes
            handlerInput.attributesManager.setSessionAttributes(persistentAttributes);
        }
    }
};

const SaveAttributesResponseInterceptor = {
    async process(handlerInput, response) {
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const shouldEndSession = (typeof response.shouldEndSession === "undefined" ? true : response.shouldEndSession);//is this a session end?
        if(shouldEndSession || handlerInput.requestEnvelope.request.type === 'SessionEndedRequest') { // skill was stopped or timed out            
            attributesManager.setPersistentAttributes(sessionAttributes);
            await attributesManager.savePersistentAttributes();
        }
    }
};

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        let speakOutput = '';
        
        estadoPartida = 0
        pregunta = 0
        intentos = 0
        //const {attributesManager} = handlerInput;
        //const sessionAttributes = attributesManager.getSessionAttributes();
        
        if(estadoPartida === 0){
        speakOutput = `Bienvenido a Can Clues, ??quieres iniciar una partida?`
        }else{
            speakOutput = 'Bienvenido a Can Clues. Hay una partida guardada, ??quieres continuar?'
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const YesIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent';
    },
    handle(handlerInput) {
        let speakOutput = '';
        
        if(estadoPartida === 0 && pregunta === 0){
            speakOutput = `Durante este juego tendr??s que usar algunos objetos y tomar decisiones que afectar??n el rumbo de la historia, para decidir qu?? opci??n tomar s??lo tienes que decir uno o dos... Comienza el juego 
            <voice name="Lupe"> <amazon:domain name="news"> <audio src="soundbank://soundlibrary/radios_static/radios_static_06"/> La hija de Isao Okada, el due??o de la f??brica m??s grande de nuestra ciudad, ha desaparecido este 9 de abril. Su nombre es Hana Okada, lo ??ltimo que se sabe de ella es que iba en camino a su casa despu??s de la escuela, pero nunca lleg??. Se rastre?? su celular y su m??s reciente localizaci??n indica que estaba en el bosque Kokura... </amazon:domain> </voice> <audio src="soundbank://soundlibrary/radios_static/radios_static_06"/>
            Silencias el radio, eres el detective asignado al caso y ya sabes toda esa informaci??n, ahora mismo te diriges en un auto a aquel bosque. 
            Vas junto a tu fiel compa??ero canino, Scraps. 
            Eres una persona cuyo ??nico inter??s es tu trabajo a excepci??n de tu canino Scraps, el cual desde que lo obtuviste has dedicado mucho tiempo a entrenar para seguir tus comandos y ayudar en tu trabajo. 
            Al llegar bajas de tu auto junto a Scraps e inspeccionas tu cajuela; tienes una mochila pero ??sta s??lo tiene espacio para 3 objetos. Los objetos son: linterna, bater??a port??til, botiqu??n, cinta m??trica, grabadora y rompe candados.
            ??Qu?? te gustar??a llevar? S??lo di el nombre de los objetos, por ejemplo, linterna, grabadora, cuerda`
            
            pista = "En la radio escuch?? que se rastre?? su celular y su m??s reciente localizaci??n indica que estaba en el bosque Kokura..."
            
            return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(`Tienes una mochila pero ??sta s??lo tiene espacio para 3 objetos. Los objetos son: linterna, bater??a port??til, botiqu??n, cinta m??trica, grabadora y rompe candados.
            ??Qu?? te gustar??a llevar? S??lo di el nombre de los objetos, por ejemplo, linterna, grabadora, cuerda`)
            .getResponse();
        }else if(estadoPartida === 1){
            speakOutput = 'Continuar??s donde te quedaste'
        }else if(pregunta === 1){ //para selecionar el inventario
            pregunta = 2
            speakOutput = `Se han agregado ${objetoUno}, ${objetoDos} y ${objetoTres} al inventario.
            Con todo listo te decides a entrar al bosque, caminas sin rumbo por un rato sin encontrar nada, de repente Scraps insiste en ir a una direcci??n en particular.
            ??Qu?? quieres hacer?
            Uno. Seguir buscando donde est??s.
            Dos. Seguir a Scraps.`;
        }else if(pregunta === 10){
            speakOutput = "Como no sabes el PIN, no puedes continuar con tu investigaci??n y el caso queda sin resolver... !Has perdido! ??Quieres volver a intentarlo?"
            pregunta = 11
        }else if(pregunta === 11){
            estadoPartida = 0
            pregunta = 0
            intentos = 0
            pista = ""
            objetoUno = ""
            objetoDos = ""
            objetoTres = ""
            speakOutput = `Durante este juego tendr??s que usar algunos objetos y tomar decisiones que afectar??n el rumbo de la historia, para decidir qu?? opci??n tomar s??lo tienes que decir uno o dos... Comienza el juego 
            <voice name="Lupe"> <amazon:domain name="news"> <audio src="soundbank://soundlibrary/radios_static/radios_static_06"/> La hija de Isao Okada, el due??o de la f??brica m??s grande de nuestra ciudad, ha desaparecido este 9 de abril. Su nombre es Hana Okada, lo ??ltimo que se sabe de ella es que iba en camino a su casa despu??s de la escuela, pero nunca lleg??. Se rastre?? su celular y su m??s reciente localizaci??n indica que estaba en el bosque Kokura... </amazon:domain> </voice> <audio src="soundbank://soundlibrary/radios_static/radios_static_06"/>
            Silencias el radio, eres el nuevo detective del pueblo y te han asignado el caso, ahora mismo te diriges en un auto a aquel bosque. 
            Vas junto a tu fiel compa??ero canino, Scraps. 
            Eres una persona cuyo ??nico inter??s es tu trabajo a excepci??n de tu canino Scraps, el cual desde que lo obtuviste has dedicado mucho tiempo a entrenar para seguir tus comandos y ayudar en tu trabajo. 
            Al llegar bajas de tu auto junto a Scraps e inspeccionas tu cajuela; tienes una mochila pero ??sta s??lo tiene espacio para 3 objetos. Los objetos son: linterna, bater??a port??til, botiqu??n, cinta m??trica, grabadora y rompe candados.
            ??Qu?? te gustar??a llevar? S??lo di el nombre de los objetos, por ejemplo, linterna, grabadora, cuerda`
            
            pista = "En la radio escuch?? que se rastre?? su celular y su m??s reciente localizaci??n indica que estaba en el bosque Kokura..."
            
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(`Tienes una mochila pero ??sta s??lo tiene espacio para 3 objetos. Los objetos son: linterna, bater??a port??til, botiqu??n, cinta m??trica, grabadora y rompe candados.
                ??Qu?? te gustar??a llevar? S??lo di el nombre de los objetos, por ejemplo, linterna, grabadora, cuerda`)
                .getResponse();
            
        } else if(pregunta === 13){
            if(objetoUno === "rompe candados" || objetoUno === "rompe candado"){
                objetoUno = ""
            }
            if(objetoDos === "rompe candados" || objetoDos === "rompe candado"){
                objetoDos = ""
            }
            if(objetoTres === "rompe candados" || objetoTres === "rompe candado"){
                objetoTres = ""
            }
            //pendiente
        } else if(pregunta === 14){
            speakOutput = "Como no sabes la contrase??a, no puedes continuar con tu investigaci??n y el caso queda sin resolver... !Has perdido! ??Quieres volver a intentarlo?"
            pregunta = 11
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
}

const NoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent';
    },
    handle(handlerInput) {
        let speakOutput = '';
        
        if(estadoPartida === 0 && pregunta === 0){
            speakOutput = `Adi??s`
            return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
        }else if(estadoPartida === 1 && pregunta === 0){
            speakOutput = 'Continuar??s donde te quedaste'
            //cambiar los atributos de la sesi??n para que sean los originales
        }else if(pregunta === 1){ //para selecionar el inventario
            speakOutput = `Tienes una mochila pero ??sta s??lo tiene espacio para 3 objetos. Los objetos son: linterna, bater??a port??til, botiqu??n, cinta m??trica, grabadora y rompe candados.
            ??Qu?? te gustar??a llevar? S??lo di el nombre de los objetos, por ejemplo, linterna, grabadora, cuerda`;
            return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
        }else if(pregunta === 3){
            speakOutput = `Decides que no es importante, por lo que tienes que seguir buscando.`
        }else if(pregunta === 10){
            speakOutput = "??Cu??l es el pin?"
            pregunta = 9
        }else if(pregunta === 11){
            speakOutput = "Adi??s"
            return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
        }else if(pregunta === 13 || pregunta === 14){
            speakOutput = "??Cu??l es la contrase??a?"
            pregunta = 12
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt()
            .getResponse();
    }
};

const ObjetoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ObjetoIntent';
    },
    handle(handlerInput) {
        let speakOutput = ''
        
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        
        objetoUno = handlerInput.requestEnvelope.request.intent.slots.objetoUno.value
        objetoDos = handlerInput.requestEnvelope.request.intent.slots.objetoDos.value
        objetoTres = handlerInput.requestEnvelope.request.intent.slots.objetoTres.value
        
        if(objetoDos !== objetoUno && objetoDos !== objetoTres && objetoTres !== objetoUno){
            speakOutput = `??Est??s seguro de que quieres llevar estos objetos?`
            pregunta = 1
        } else {
            speakOutput = `Tienes que elegir tres objetos diferentes`
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
}

const CandadoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CandadoIntent';
    },
    handle(handlerInput) {
        intentos = intentos + 1
        let speakOutput = '';
        const primero = handlerInput.requestEnvelope.request.intent.slots.primero.value
        const segundo = handlerInput.requestEnvelope.request.intent.slots.segundo.value
        const tercero = handlerInput.requestEnvelope.request.intent.slots.tercero.value
        const cuarto = handlerInput.requestEnvelope.request.intent.slots.cuarto.value
        
        if(pregunta === 9){
            console.log("Llego aqu??")
            if(primero !== "0" || segundo !== "3" || tercero !== "1" || cuarto !== "0"){
                if((objetoUno === "grabadora" || objetoDos === "grabadora" || objetoTres === "grabadora") && intentos === 1){
                    speakOutput = `Te voy a dar una pista. Tienes una grabadora y has guardado lo siguiente.` + pista + `??Cu??l es el PIN? Puedes repetir lo que dice la grabadora diciendo reproducir`
                }else if ((objetoUno === "grabadora" || objetoDos === "grabadora" || objetoTres === "grabadora") && intentos === 2){
                    speakOutput = `Te voy a dar una pista. Ves que el celular tiene muchas llamadas perdidas de Mam?? y Pap?? por lo que lo m??s probable es que sea de Hana. ??Cu??l es el PIN?`
                }else if(intentos === 1){
                    speakOutput = `Te voy a dar una pista. Ves que el celular tiene muchas llamadas perdidas de Mam?? y Pap?? por lo que lo m??s probable es que sea de Hana. ??Cu??l es el PIN?`
                }else if(intentos === 2){
                    speakOutput = `Te voy a dar una pista. Hana es muy olvidadiza y siempre anota sus contrase??as, las suele guardar en sus pertenencias. ??Cu??l es el PIN?`
                }else if (intentos % 5 !== 0){
                    speakOutput = `No funcion??, intenta otro pin`
                }else {
                    speakOutput = "??Quieres rendirte? Perder??as el juego"
                    pregunta = 10
                }
            }else{
                speakOutput = `Empiezas a buscar en el celular, el ??ltimo mensaje que no se alcanz?? a enviar es... Mam??, ??AY??DAME!, es un hombre muy grande que dice cosas muy extra??as, que nunca me dejar?? ir porque despu??s del quinto atardecer ser?? parte del bosque...
                Te sorprendes demasiado, pero no entiendes el mensaje, es un poco extra??o <audio src="soundbank://soundlibrary/voices/human/human_06"/>
                Scraps levanta sus orejas y le das la instrucci??n de que gu??e, trata de averiguar el camino correcto ya que los gritos son constantes y m??s fuertes conforme se acercan, hasta que llegas a una caba??a.
                Te acercas con sigilo, tratas de abrir la puerta r??pidamente <audio src="soundbank://soundlibrary/doors/doors_knocks/knocks_06"/> Pero hay un candado con una clave de seis letras. ??Cu??l es la contrase??a?`
                
                intentos = 0
            }
            
            
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const UnoDosIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'UnoDosIntent';
    },
    handle(handlerInput) {
        
        const numero = handlerInput.requestEnvelope.request.intent.slots.numero.value
        
        let speakOutput = '';
        
        if((pregunta === 2 || pregunta === 4 || pregunta === 5 || pregunta === 7) && (numero < 1 || numero > 2)){
            speakOutput = "S??lo puedes escoger entre uno y dos."
        } else {
        
        switch(pregunta){
            case 2:
                if(numero === "1"){
                    speakOutput = `Sigues mirando alrededor y encuentras una huella fresca frente a ti que obviamente no es tuya, necesitas medirla para saber si es de un hombre o una mujer. Pero...`
                    
                    if(objetoUno === "cinta metrica" || objetoDos === "cinta metrica" || objetoTres === "cinta metrica" || objetoUno === "cinta" || objetoDos === "cinta" || objetoTres === "cinta" || objetoUno === "cinta m??trica" || objetoDos === "cinta m??trica" || objetoTres === "cinta m??trica" ){
                        speakOutput = speakOutput + `Usas la cinta m??trica y mides la huella, parece ser de hombre. ??Qu?? raro!, la que desapareci?? es una chica, alguien m??s debe andar por aqu??.`
                        pista = pista + "La huella que med?? la huella, parece ser de hombre..."
                    }else {
                        speakOutput = speakOutput + ` ??L??stima! No traes la cinta m??trica, deber??s seguir buscando.`
                    }
                    speakOutput = speakOutput + " Continuaci??n pr??ximamente en Can Clues 2.0. ??Quiere intentarlo de nuevo?"
                    pregunta = 11
                } else {
                    speakOutput = `Scraps te gu??a hacia algo que est?? colgando de una rama, te acercas y observas que es un pedazo de tela, al parecer es de una blusa de mujer. Se escucha algo
                    <audio src="soundbank://soundlibrary/human/amzn_sfx_walking_on_grass_02"/>
                    <audio src="soundbank://soundlibrary/animals/amzn_sfx_dog_med_bark_2x_03"/> <audio src="soundbank://soundlibrary/animals/amzn_sfx_dog_med_bark_growl_01"/>
                    Scraps est?? avisando. ??Qu?? quieres hacer?
                    Uno. Indicar a Scraps que ignore el sonido y darle a oler la prenda.
                    Dos. Dejar que Scraps te gu??e hacia el sonido.`
                    pregunta = 4
                }
            break;
            case 4:
                if(numero === "1"){
                    speakOutput = `Le das a Scraps el comando de ???silencio??? y le acercas la prenda a su nariz. Scraps procede a mover la cabeza de un lado a otro inspeccionando el olor para memorizarlo, comienza a olfatear el suelo e indica que debes ir por la derecha y decides seguirlo.
                    Despu??s de caminar unos minutos, Scraps se detiene frente a un barranco. Te asomas y ves que hay una mochila en una parte sobresaliente que no es alcanzable con s??lo estirar el brazo. Pero...`
                    
                    if(objetoUno === "cuerda" || objetoDos === "cuerda" || objetoTres === "cuerda"){
                        speakOutput = speakOutput + ` Usas la cuerda que hay en tu inventario para bajar. R??pidamente tomas la mochila y regresas con Scraps. 
                        Al buscar dentro de ella encuentras la identificaci??n de Hana Okada y varios cuadernos. 
                        Empiezas a hojearlos, s??lo hablan de varias materias escolares, de repente se cae una nota con el n??mero 0310, pero no le encuentras significado por lo que contin??as. Entre uno de los cuadernos encuentras un recorte de peri??dico que dice... <voice name="Lupe"> <amazon:domain name="news">??Ha sucedido de nuevo! La leyenda local cuenta que una vez que entras al bosque Kokura no hay salida... </amazon:domain> </voice>
                        <audio src="soundbank://soundlibrary/animals/amzn_sfx_dog_med_bark_2x_03"/>
                        Scraps est?? avisando. ??Qu?? quieres hacer? 
                        Uno. Dejar de leer y ver a qu?? le ladra Scraps.
                        Dos. Ignorar a Scraps y seguir leyendo.`
                        
                        pista = pista + "Abr?? los cuadernos y se cay?? una nota con el n??mero 0310 pero no entiendo el significado, el peri??dico dice que nunca se puede salir de este bosque..." 
//AQUI LA ULTIMA PISTA QUE AGREGUE                        
                        pregunta = 5
                    } else {
                        speakOutput = speakOutput + ` ??Qu?? quieres hacer?
                        Uno. Irse pues no traes una cuerda.
                        Dos. Intentar bajar de todos modos.`
                        pregunta = 6
                    }
                } else {
                    speakOutput = `Van hacia el sonido y logran ver la silueta de una persona que r??pidamente se esconde entre la maleza. Intentas llamarle, pero la persona se sigue alejando de ti. <audio src="soundbank://soundlibrary/animals/amzn_sfx_dog_med_bark_growl_01"/> Scraps est?? muy inquieto. ??Qu?? quieres hacer? 
                    Uno. Seguir a la persona sospechosa.
                    Dos. Irse del lugar pues podr??a ser peligroso.`
                    pista = pista + `Logr?? ver la silueta de una persona y en cuanto le llam?? se fue...`
                    pregunta = 7
                }
            break;
            case 5:
                if(numero === "1"){
                    speakOutput = `Escuchas nuevamente el sonido que proviene de las hierbas pero esta vez si decides averiguar quien es.
                    <audio src="soundbank://soundlibrary/footsteps/running/running_07"/> Inicia la persecuci??n, mientras lo sigues vas chocando con varias ramas, pero, ??qu?? extra??o!, esta persona no choca con ninguna, es como si conociera el bosque.
                    Te das cuenta de que se trata de un hombre pues conforme te acercas observas que es alto y corpulento.
                    Scraps es m??s r??pido y est?? a punto de atraparlo, pero de repente la persona se voltea y lo patea fuertemente antes de seguir corriendo, Scraps se queda tirado e inconsciente.
                    ??Qu?? quieres hacer? 
                    Uno. Dejar a Scraps para perseguir al hombre.
                    Dos. Quedarte con Scraps dejando escapar al hombre.`
                    pista = pista + `La silueta que vi es un hombre sopechoso y violento...`
                    pregunta = 8
                }else{
                    speakOutput = `Contin??as leyendo... <voice name="Lupe"> <amazon:domain name="news">El d??a 9 de abril se vio por ??ltima vez a Ryo Tamura despu??s de salir con sus amigos, la gente murmura que est?? en el bosque, pero los detectives se han negado a investigar...</amazon:domain> </voice> Un ??rbol que cae interrumpe tu lectura.
                    Scraps levanta sus orejas y le das la instrucci??n de que te gu??e pues podr??a ser importante.
                    Llegas a donde el ??rbol se cay?? pero??? ??Ah! S??lo es un castor.
                    Miras a tu alrededor y te das cuenta de que llegaste a un r??o, cuando te das la vuelta para irte, Scraps se regresa y encuentra unas huellas que se detienen en la orilla. 
                    Poni??ndote en la misma posici??n y mirando el r??o te das cuenta que hay algo rectangular en el fondo. Metes la mano y sacas un celular, lo secas y tratas de encenderlo, pero no tiene bater??a.`
                    pista = pista + `El 9 de abril se perdi?? Ryo Tamura en este mismo bosque...`
                    
                    if(objetoUno === "bateria portatil" || objetoDos === "bateria portatil" || objetoTres === "bateria portatil" || objetoUno === "bateria" || objetoDos === "bateria" || objetoTres === "bateria" || objetoUno === "bater??a port??til" || objetoDos === "bater??a port??til" || objetoTres === "bater??a port??til" || objetoUno === "bater??a" || objetoDos === "bater??a" || objetoTres === "bater??a"){
                        speakOutput = speakOutput + ` De inmediato lo conectas a la bater??a port??til que traes, esperas unos minutos antes de volver a intentar prenderlo.
                        Esta vez lo logras y el celular inicia, pero al intentar desbloquearlo te pide un pin de 4 d??gitos.
                        ??Cu??l es el PIN?`
                        pregunta = 9
                    }else {
                        speakOutput = speakOutput + ` ??L??stima! No traes la bater??a port??til, deber??s seguir buscando... Continuaci??n pr??ximamente en Can Clues 2.0 ??Quieres volver a empezar?`
                        pregunta = 11
                    }
                    
                    
                    
                }
            break;
            case 7:
                if(numero === "1"){
                    speakOutput = `<audio src="soundbank://soundlibrary/footsteps/running/running_07"/> Inicia la persecuci??n, mientras lo sigues vas chocando con varias ramas, pero, ??qu?? extra??o!, esta persona no choca con ninguna, es como si conociera el bosque.
                    Te das cuenta de que se trata de un hombre pues conforme te acercas observas que es alto y corpulento.
                    Scraps es m??s r??pido y est?? a punto de atraparlo, pero de repente la persona se voltea y lo patea fuertemente antes de seguir corriendo, Scraps se queda tirado e inconsciente.
                    ??Qu?? quieres hacer? 
                    Uno. Dejar a Scraps para perseguir al hombre.
                    Dos. Quedarte con Scraps dejando escapar al hombre.`
                    pista = pista + `La silueta que vi es un hombre sopechoso y violento...`
                    pregunta = 8
                } else {
                    speakOutput = `Le das a Scraps el comando de ???silencio??? y dejas ir a la persona.
                    Deciden regresar a donde hab??an encontrado la prenda y se la acercas a su nariz. 
                    Scraps procede a mover la cabeza de un lado a otro inspeccionando el olor para memorizarlo, comienza a olfatear el suelo e indica que debes ir por la derecha y decides seguirlo.
                    Despu??s de caminar unos minutos, Scraps se detiene frente a un barranco. Te asomas y ves que hay una mochila en una parte sobresaliente que no es alcanzable con s??lo estirar el brazo. Pero...`
                    
                    if(objetoUno === "cuerda" || objetoDos === "cuerda" || objetoTres === "cuerda"){
                        speakOutput = speakOutput + ` Usas la cuerda que hay en tu inventario para bajar. R??pidamente tomas la mochila y regresas con Scraps. 
                        Al buscar dentro de ella encuentras la identificaci??n de Hana Okada y varios cuadernos. 
                        Empiezas a hojearlos, s??lo hablan de varias materias escolares, de repente se cae una nota con el n??mero 0310, pero no le encuentras significado por lo que contin??as. Entre uno de los cuadernos encuentras un recorte de peri??dico que dice... <voice name="Lupe"> <amazon:domain name="news">??Han pasado 31 a??os! La leyenda local cuenta que otra persona desaparecer??a en el bosque Kokura... </amazon:domain> </voice>
                        <audio src="soundbank://soundlibrary/animals/amzn_sfx_dog_med_bark_2x_03"/>
                        Scraps est?? avisando. ??Qu?? quieres hacer? 
                        Uno. Dejar de leer y ver a qu?? le ladra Scraps.
                        Dos. Ignorar a Scraps y seguir leyendo.`
                        pista = pista + "Abr?? los cuadernos y se cay?? una nota con el n??mero 0310 pero no entiendo el significado, el peri??dico dice que nadie sale de este bosque ..."
                        pregunta = 5
                    } else {
                        speakOutput = speakOutput + ` ??Qu?? quieres hacer?
                        Uno. Irse pues no traes una cuerda.
                        Dos. Intentar bajar de todos modos.`
                        pregunta = 6
                    }
                }
            break;
            case 6:
                if(numero === "1"){
                    speakOutput = speakOutput + " Continuaci??n pr??ximamente en Can Clues 2.0. ??Quiere intentarlo de nuevo?"
                    pregunta = 11
                }else{
                    speakOutput = "Te las arreglas para bajar, pero cuando est??s a punto de llegar a la mochila te das cuenta de que ya no tienes de d??nde sujetarte y ya no puedes regresar. Scraps llora mientras t?? pierdes fuerza. Cuando ya no puedes m??s te dejas ir y??? ??Has perdido! ??Quieres intentarlo de nuevo?"
                    pregunta = 11
                }
            break;
            case 8:
                if(numero === "1"){
                    speakOutput = "A pesar de que es tu mejor amigo, lo abandonas y contin??as persiguiendo al hombre lo que causa que entre en p??nico. Corre err??ticamente y termina por escaparse, miras a tu alrededor y te das cuenta de que no tienes ni idea de d??nde est??s, gritas por ayuda, pero nadie te escucha, y piensas que recibes un castigo por alejarte de lo m??s importante para ti, Scraps se quedar?? solo, entonces lentamente cierras los ojos y??? ??Has perdido! ??Quieres intentarlo otra vez?"
                    pregunta = 11
                } else {
                    speakOutput = "Ves como el hombre se aleja, pero te concentras en Scraps, comienzas a hablarle y despierta, notas que no puede caminar bien. Pero..."
                    if(objetoUno === "botiqu??n" || objetoDos === "botiqu??n" || objetoTres === "botiqu??n" || objetoUno === "botiquin" || objetoDos === "botiquin" || objetoTres === "botiquin"){
                        speakOutput = speakOutput + "Usas el botiqu??n que tienes en el inventario y Scraps se recupera como si no le hubiera sucedido nada, as?? que podr?? seguir ayud??ndote."
                    }else{
                        speakOutput = speakOutput + "Lamentablemente no tienes con qu?? curarlo, tardar?? un rato en recuperarse y no podr?? ayudarte."
                    }
                }
                speakOutput = speakOutput + " Continuaci??n pr??ximamente en Can Clues 2.0. ??Quiere intentarlo de nuevo?"
                pregunta = 11
            break;
            case 9:
                speakOutput = "Dame el pin de una sola vez"
            break;
            case 15:
                if(numero === "1"){
                    speakOutput = "Decides que Hanna debe irse, porque sabes que es lo correcto. Te despides y lloras al ver a tu fiel compa??ero Scraps, ??l comienza a insistir en quedarse contigo pero le das la ??ltima instrucci??n que es sacar a Hanna del bosque, siempre ha sido un canino fiel as?? que te obedece, mientras que a Hanna le encargas cuidarlo. Ves como se alejan, te resignas a no hacer lo mismo que Ryo pues eres un detective, comienza el atardecer y te desvaneces pero Ryo logra salir. ??El juego ha terminado, has logrado llegar al final! ??Quieres volver a jugar?"
                    pregunta = 11
                } else {
                    speakOutput = `El miedo te ha paralizado, el ser detective queda en segundo t??rmino despu??s de lo que has presenciado. Te disculpas con Hanna y ella comienza a llorar, evitas verla a los ojos. Tomas a Scraps a la fuerza pues ??l quiere ayudarla pero lo obligas a salir del bosque contigo.
                    Han pasado unos d??as, la conciencia no te deja en paz, has fallado como detective y ser humano, crees que no eres digno de estar con Scraps as?? que lo das a una familia que si lo merezca. Esta culpa te acompa??a hasta el fin de tus d??as. ??El juego ha terminado, has logrado llegar al final! ??Quieres volver a jugar?`
                    pregunta = 11
                }
        }
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
}

const ReproducirIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ReproducirIntent';
    },
    handle(handlerInput) {
        const speakOutput = pista + "??Cu??l es el contrase??a?";

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const PuertaIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PuertaIntent';
    },
    handle(handlerInput) {
        intentos = intentos + 1
        let speakOutput = '';
        
        const primera = handlerInput.requestEnvelope.request.intent.slots.primera.value
        const segunda = handlerInput.requestEnvelope.request.intent.slots.segunda.value
        const tercera = handlerInput.requestEnvelope.request.intent.slots.tercera.value
        const cuarta = handlerInput.requestEnvelope.request.intent.slots.cuarta.value
        const quinta = handlerInput.requestEnvelope.request.intent.slots.quinta.value
        const sexta = handlerInput.requestEnvelope.request.intent.slots.sexta.value
        
        if((primera === "K" || primera === "k") && (segunda === "O" || segunda === "o") && (tercera === "K" || tercera === "k") && (cuarta === "U" || cuarta === "u") && (quinta === "R" || quinta === "r") && (sexta === "A" || sexta === "a")){
            speakOutput= `<audio src="soundbank://soundlibrary/clocks/clock/clock_01"/> <audio src="soundbank://soundlibrary/home/amzn_sfx_door_open_01"/> Se abri?? la puerta y antes de entrar le das a Scraps la instrucci??n de Cuidar por lo que se queda afuera mirando los alrededores. Una vez que entras observas a Hanna amarrada en una silla, comienzas a desatarla
            <audio src="soundbank://soundlibrary/animals/amzn_sfx_dog_med_bark_2x_03"/>
            Le dices a Hana que se quede dentro pues podr??a ser peligroso y sales para ver a Scraps, no sin antes de que Hana te advierta de que podr??a ser Ryo.
            <voice name="Miguel">  ??Deja a Hana! Ya ha sido escogida, s??lo faltan unas horas para que se complete el pacto ??no lo entiendes?, s??lo hay una forma de salir y ella es la clave para liberarme <audio src="soundbank://soundlibrary/human/amzn_sfx_laughter_giggle_02"/>
            El bosque controla tu mente y tu cuerpo, las otras personas se rindieron, pero yo traje un reemplazo as?? que me ir??. 
            Si quieres intenta irte, a mi no me interesa lastimarte, el bosque ya me dijo que alguno de los dos se tiene que quedar. <audio src="soundbank://soundlibrary/human/amzn_sfx_laughter_giggle_02"/> </voice>
            Piensas que est?? loco y regresas para tomar a Hanna, pero al intentar salir de la caba??a, el bosque comienza bloquear tu camino con la maleza pero tambi??n escuchas sonidos aterradores. Entonces crees en la historia de Ryo.
            <voice name="Miguel"> El bosque Kokura ya te demostr?? de qu?? es capaz, deber??as comenzar a elegir qui??n se ir??. </voice> ??Qui??n deber??a irse?
            Uno. Se ir?? Hanna.
            Dos. Te ir??s t??`
            pregunta = 15
        } else if(intentos === 2 && (objetoUno === "grabadora" || objetoDos === "grabadora" || objetoTres === "grabadora")){
            speakOutput = `<audio src="soundbank://soundlibrary/clocks/clock/clock_01"/> No se abri??, te voy a dar una pista. Tienes una grabadora y has guardado lo siguiente.` + pista + `??Cu??l es la contrase??a? Puedes repetir lo que dice la grabadora diciendo reproducir`
        } else if((intentos === 3 || intentos === 2) && (objetoUno === "rompe candados" || objetoDos === "rompe candados" || objetoTres === "rompe candados" || objetoUno === "rompe candado" || objetoDos === "rompe candado" || objetoTres === "rompe candado")){
            speakOutput = `<audio src="soundbank://soundlibrary/clocks/clock/clock_01"/> No se abri??, tienes un rompe candados en mal estado por lo que s??lo puedes usarlo una vez, ??quieres usarlo ahora?`
            pregunta = 13
        } else if (intentos === 2){
             speakOutput = `<audio src="soundbank://soundlibrary/clocks/clock/clock_01"/> No se abri??, te voy a dar una pista. La contrase??a sali?? en el peri??dico.`
        } else if (intentos % 5 !== 0){
            speakOutput = `<audio src="soundbank://soundlibrary/clocks/clock/clock_01"/> El candado no se abre, intenta de nuevo`
        } else {
            speakOutput = "??Quieres rendirte? Perder??as el juego"
            pregunta = 14
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};


const IniciarIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'IniciarIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn???t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        YesIntentHandler,
        NoIntentHandler,
        ObjetoIntentHandler,
        UnoDosIntentHandler,
        CandadoIntentHandler,
        //OpcionIntentHandler,
        ReproducirIntentHandler,
        PuertaIntentHandler,
        HelloWorldIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .addRequestInterceptors(LoadAttributesRequestInterceptor)
    .addResponseInterceptors(SaveAttributesResponseInterceptor)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .withPersistenceAdapter(persistenceAdapter)
    .lambda();