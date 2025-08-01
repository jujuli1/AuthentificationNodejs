const express = require('express')
const cookieParser = require('cookie-parser');
const path = require('path')
const session = require('express-session');
const { localStorage, LocalStorage } = require('node-localstorage')
const bcrypt = require('bcrypt')
const salt = 10;

const {v4: uuidv4} = require('uuid')
const { MongoClient} = require('mongodb')
const app = express()

const fs = require('fs')



const hostname = 'localhost'
const port = 3000

app.set('view engine', 'ejs')
app.set('views', './views')

// pour parser formulaire
app.use(express.urlencoded({ extended: true }));

//public
app.use(express.static(path.join(__dirname, 'public')))


//json
app.use(express.json())


//cookie admin
app.use(cookieParser());


//session
app.use(session({
    secret: 'maChaîneSecrèteTrèsComplexe123!@#',
    saveUninitialized: true,
    resave:true,
    cookie: { secure:false }
}))



const FILE_PATH = path.join(__dirname, 'info.json')



//conection mongodb 
const uri = "mongodb://localhost:27017/dbLogin"
    const client = new MongoClient(uri);
    let db;

    async function connectionMongo(){
        try{
           await client.connect()
           db =  client.db('dbLogin')
            usersCollection = db.collection('users')
        console.log('Connecttion ok');
        }catch(err)  {
        console.log('erreur de la connectionn')
    }

        }
        connectionMongo();
    


function lireData(){

    try{
    const data = fs.readFileSync(FILE_PATH, 'utf8')
    return JSON.parse(data)
    }catch(e){
        return []
    }
    
}

function ecrireData(data){
    const dataAecrire = fs.writeFileSync(FILE_PATH, JSON.stringify(data))
}

function admin(req, res, next) {
    if (!req.session || !req.session.uzer) {
        return res.redirect('/auth');
    }
    next();
}




app.get('/', (req,res) => {

    res.render( 'index')

})



app.get('/jeux', (req,res) => {
    res.render( 'jeux')
})



app.post('/jeux', (req, res) => {

    

    const alea = Math.random() * (100, 1) + 1
    const saisie = req.body.saisie

    if(saisie < alea){
    const sub = "plus haut"
    res.send(`${sub}`)
    
    }
    if(saisie > alea){
        const sub = "plus bas"
        res.send(`${sub}`)
        
    }
    if(saisie === alea){
        const sub = "bravo"
        res.send(`${sub}`)
    }

})

app.get('/createCompte', (req,res) => {
    res.render( 'SignIn', { errorMessage: ""})
})

app.post('/createCompte', async (req,res) => {




     //ajout a mongodb compass
     try{
        const {mail, mp, mpConf} = req.body
        if(!mp || !mail || !mpConf){

           return res.render('SignIn', {errorMessage:"veuillez remplir tout les champs !"})

         }  

        if(mp != mpConf){

            return res.render('SignIn', { errorMessage:'Les mots de passe ne correspondent pas ...'})
            
        }

        const users = await usersCollection.find({}).toArray()
        const uzerExist = users.find(users => users.mail=== req.body.mail)

        if(uzerExist){
            return res.render('SignIn', { errorMessage:'Un compte avec ces coordonnées existe déja'})
        }

        bcrypt.hash(mp, salt, (error,hash) => {
            if(error){
            return console.error(err);
            }
            console.log("hash: ok ;)" + hash)
    
            bcrypt.compare(mp, hash, (error, result) => {
                if(error){
                    return console.log(error)
                }
    
                console.log('mot de passe ok ?', result)
            })
        })

        
        const resultat = await db.collection('users').insertOne({mail, mp, mpConf});
           return res.render('login')
            
        

     }catch(err){
        console.error(err);
        res.status(500).json({ errorMessage: "erreur du serv"})
     }

    

})


app.get('/auth', (req,res) => {
    res.render( 'login')
})

app.post('/auth', async (req,res)=> {


     const lasDatas = client.db("dbLogin")
     const usersCollection =  db.collection("users")


    let nextId = uuidv4();
    const {inputMail, inputPassword} = req.body
 

    let authUzer = await usersCollection.findOne({mail: inputMail, mp: inputPassword });

    
    if(authUzer){
        res.send(`Bienvenue ${inputMail}`)
    }else{
        
        res.render('SignIn', {errorMessage: "Compte introuvable, veuillez en créer un !"})
        
    }
    

})

app.get('/admin', admin, (req,res) => {

    const uzer = lireData();
    res.send(`Bienvenue  ${req.session.uzer}`)

})





app.listen(port, ()=> {
    console.log(` ok sur http://${hostname}:${port}`)
})