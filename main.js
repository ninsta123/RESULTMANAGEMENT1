const express = require('express');
const parser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();
const sequelize = require('./DataBase/database');
const TeacherData = require('./Models/teachers');
const StudentData = require('./Models/students');
app.set('view engine', 'ejs');
const path = require('path');
const { url } = require('inspector');

app.use(cookieParser());

app.use(session({
    name: 'currentlogin',
    resave: false,
    secret: 'secretsession',
    saveUninitialized:false,
    cookie:{
        maxAge: 1000*60*2,
        sameSite: true,
    }
}));

app.use(express.json());
sequelize.sync();

// used for jason parsing while using api
var jsonParser = parser.json()

// create application/form-urlencoded parser
var urlencodedParser = parser.urlencoded({ extended: false })

app.get('/', (req, res) => {
    res.render('index');
});
//------------------------------------------------------------------------------------------------
app.get('/teachersLogin', (req, res) => {
    res.render('teachersLogin', { errorMesssage: "" });
});

app.get('/studentMarks', (req, res) => {
    res.render('studentMarks',{ errorMesssage: "" });
});

app.get('/newuser', (req, res) => {
    res.render('signup', { errorMesssage: "" });
});

app.post('/register', urlencodedParser, async (req, res) => {
    var data = await TeacherData.findAll({
        raw: true,
        attributes: ["id"],
        where: {
            id: req.body.teacherID
        }
    });
    if (data.length == 0) {
        const user = await TeacherData.create({ id: req.body.teacherID, email: req.body.mail, name: req.body.teacherName, password: req.body.passwd });
         res.render('teachersLogin',{ errorMesssage: "" });
    }
    else {

        res.render('signup', { errorMesssage: "Teacher ID already exists" });
    }
});

app.post('/userLogin',urlencodedParser,async (req, res) => {
   
    var data = await TeacherData.findAll({
        raw: true,
        attributes: ["id", "password"],
        where: {
            id: req.body.teacherID,
            password: req.body.passwd
        }
    });
    if (data.length == 0) {
        res.render('teachersLogin', { errorMesssage: "Invalid Credentials" });
    }
    else {
        var studentData = await StudentData.findAll({
            raw:true,
            where:{
                teacher:req.body.teacherID
            }
        });
        req.session.userId=req.body.teacherID;
        res.render('session', {  username:req.body.teacherID,studentData });
    }
});
app.post('/add', urlencodedParser,(req, res) => {
    
    res.render('addStudent', { username: req.query.id, errorMesssage: "" });
});
app.post('/adddetails', urlencodedParser,async (req, res) => {
    
    var data = await StudentData.findAll({
        raw: true,
        where: {
            rollno: req.body.rollno,
            teacher:req.query.id
        }
    });
    if (data.length == 0) {
        const user = await StudentData.create({ rollno: req.body.rollno, dob: req.body.dob.toString().slice(0,10), name: req.body.studentName, marks: req.body.marks,teacher:req.query.id });
        var studentData = await StudentData.findAll({raw:true,where:{teacher:req.query.id}});  
        res.render('session', { username:req.query.id,studentData });
    }
    else {
        res.render('addStudent', { username:req.query.id, errorMesssage: "Roll number already exists" });
    }
});
app.get('/session', async (req, res) => {
    
    var studentData = await StudentData.findAll({
        raw:true,
        where:{
            teacher:req.query.id
        }
    });
    
    res.render('session', { username:req.query.id,studentData });
});

app.get('/update' ,async (req, res) => {

    var studentData = await StudentData.findAll({
        raw:true,
        where: {
            rollno: req.query.sid
        }
    });
    res.render('update', { username:req.query.uid,sid:req.query.sid,studentData });
});
//-----------------------------------------------------------------------------------------------------
app.post('/updatedetails',urlencodedParser,async(req,res)=>{
    
  var x = await StudentData.update(
        {
        rollno: req.body.rollno,
        name: req.body.studentName,
        dob: req.body.dob,
        marks: req.body.marks,
        },
        {
        where:{
            rollno: req.query.sid,
            teacher:req.query.id
        }
    });
  var studentData = await StudentData.findAll({raw:true,where:{teacher:req.query.id}});  

  res.render('session', { username:req.query.id,studentData });
});
//-----------------------------------------------------------------------------------------------------
app.get('/delete',async(req,res)=>{
    
   await StudentData.destroy({
        where:{
            rollno: req.query.sid,
            teacher:req.query.uid
        }
    })
    var studentData = await StudentData.findAll({raw:true,where:{teacher:req.query.uid}});  

    res.render('session', { username:req.query.uid,studentData });
})

app.post('/getmarks',urlencodedParser,async(req,res)=>{
    var student = await StudentData.findAll({
        raw: true,
        where: {
            rollno: req.body.rollno,
            dob:req.body.dob
        }
    });
    if(student.length!=0){
        res.render('getMarks', { student,errorMesssage:"" });
    }
    else{
        res.render('studentMarks',{errorMesssage:"Incorrect Credentials"})
    }
});

app.get('/studentMarksPage',(req,res)=>{
    res.render('studentMarks',{errorMesssage:""} );
});
//------------------------------------------------------
app.get('/logout',(req,res)=>{
    delete res.session;
    res.clearCookie('login');
    res.redirect('/teachersLogin');
});
app.use((req,res)=>{
    res.status(404).send("Oops The file you are looking for does not exist");
});
app.listen(8080);
