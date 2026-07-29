const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = require("./database");

const app = express();

const PORT = 3000;

const JWT_SECRET = "freshcut-secret-key";


app.use(cors());
app.use(express.json());


// ==========================
// HOME
// ==========================

app.get("/", (req, res) => {

    res.send("FreshCut API is running.");

});



// ==========================
// ADMIN LOGIN
// ==========================

app.post("/admin/login", (req,res)=>{

    const {
        username,
        password
    } = req.body;


    db.get(
        `
        SELECT *
        FROM admins
        WHERE username = ?
        `,
        [username],

        async(err, admin)=>{


            if(err){

                return res.status(500).json({
                    error: err.message
                });

            }


            if(!admin){

                return res.status(401).json({
                    message:"Invalid login."
                });

            }


            const valid = await bcrypt.compare(
                password,
                admin.password
            );


            if(!valid){

                return res.status(401).json({
                    message:"Invalid login."
                });

            }


            const token = jwt.sign(
                {
                    id: admin.id,
                    username: admin.username
                },
                JWT_SECRET,
                {
                    expiresIn:"8h"
                }
            );


            res.json({

                success:true,
                token

            });


        }
    );


});




// ==========================
// AUTH MIDDLEWARE
// ==========================

function authenticateAdmin(req,res,next){


    const authHeader = req.headers.authorization;


    if(!authHeader){

        return res.status(401).json({
            message:"No token provided."
        });

    }


    const token = authHeader.split(" ")[1];


    if(!token){

        return res.status(401).json({
            message:"Invalid token."
        });

    }


    try{

        const decoded = jwt.verify(
            token,
            JWT_SECRET
        );


        req.admin = decoded;

        next();


    }catch(error){


        return res.status(401).json({
            message:"Invalid or expired token."
        });


    }

}



// ==========================
// BOOKING VALIDATION
// ==========================

function isValidBookingTime(date,time){


    const selectedDate = new Date(date);

    const day = selectedDate.getDay();



    // Sunday + Monday closed
    if(day === 0 || day === 1){

        return false;

    }


    let endHour = 19;


    // Saturday closes 18:00
    if(day === 6){

        endHour = 18;

    }



    const hour = parseInt(time.split(":")[0]);

    const minutes = parseInt(time.split(":")[1]);



    if(hour < 10 || hour >= endHour){

        return false;

    }


    if(minutes !== 0 && minutes !== 30){

        return false;

    }


    return true;


}




// ==========================
// CREATE BOOKING
// ==========================

app.post("/book",(req,res)=>{


    const {
        name,
        phone,
        email,
        service,
        date,
        time,
        note
    } = req.body;



    if(!name || !phone || !service || !date || !time){

        return res.status(400).json({

            message:"Missing required fields."

        });

    }




    const today = new Date();

    today.setHours(0,0,0,0);


    const selectedDate = new Date(date);



    if(selectedDate < today){

        return res.status(400).json({

            message:"Cannot book previous dates."

        });

    }




    if(!isValidBookingTime(date,time)){


        return res.status(400).json({

            message:"Invalid booking time."

        });


    }




    db.get(

        `
        SELECT id
        FROM appointments
        WHERE date = ?
        AND time = ?
        AND status != 'Cancelled'
        `,

        [
            date,
            time
        ],


        (err,row)=>{


            if(err){

                return res.status(500).json({
                    error:err.message
                });

            }



            if(row){

                return res.status(409).json({

                    success:false,
                    message:"This time slot is already booked."

                });

            }





            db.run(

                `
                INSERT INTO appointments
                (
                    name,
                    phone,
                    email,
                    service,
                    date,
                    time,
                    note
                )

                VALUES (?,?,?,?,?,?,?)

                `,

                [
                    name,
                    phone,
                    email,
                    service,
                    date,
                    time,
                    note
                ],


                function(err){


                    if(err){

                        return res.status(500).json({

                            error:err.message

                        });

                    }



                    res.json({

                        success:true,
                        id:this.lastID

                    });



                }

            );



        }

    );


});





// ==========================
// ADMIN GET APPOINTMENTS
// ==========================

app.get(
"/admin/appointments",
authenticateAdmin,
(req,res)=>{


    db.all(

        `
        SELECT *
        FROM appointments
        ORDER BY date,time
        `,

        [],


        (err,rows)=>{


            if(err){

                return res.status(500).json({

                    error:err.message

                });

            }


            res.json(rows);


        }


    );


});






// ==========================
// CHANGE APPOINTMENT STATUS
// ==========================

app.put(
"/admin/appointments/:id/status",
authenticateAdmin,
(req,res)=>{


    const {
        status
    } = req.body;



    const allowedStatuses = [

        "Pending",
        "Confirmed",
        "Completed",
        "Cancelled"

    ];



    if(!allowedStatuses.includes(status)){


        return res.status(400).json({

            message:"Invalid status."

        });


    }





    db.run(

        `
        UPDATE appointments
        SET status = ?
        WHERE id = ?
        `,

        [
            status,
            req.params.id
        ],


        function(err){


            if(err){

                return res.status(500).json({

                    error:err.message

                });

            }



            res.json({

                success:true

            });


        }


    );


});







// ==========================
// AVAILABLE SLOTS
// ==========================

function generateWorkingHours(date){


    const day = new Date(date).getDay();



    if(day === 0 || day === 1){

        return [];

    }



    let endHour = 19;



    if(day === 6){

        endHour = 18;

    }



    const slots=[];



    for(let hour=10; hour<endHour; hour++){


        slots.push(
            `${hour}:00`
        );


        slots.push(
            `${hour}:30`
        );


    }



    return slots;


}





app.get("/available-slots",(req,res)=>{


    const {
        date
    } = req.query;



    if(!date){

        return res.status(400).json({

            message:"Date required."

        });

    }



    const workingHours = generateWorkingHours(date);



    db.all(

        `
        SELECT time
        FROM appointments
        WHERE date = ?
        AND status != 'Cancelled'
        `,

        [
            date
        ],


        (err,booked)=>{


            if(err){

                return res.status(500).json({

                    error:err.message

                });

            }



            const bookedTimes =
                booked.map(
                    item=>item.time
                );



            const available =
                workingHours.filter(
                    time=>!bookedTimes.includes(time)
                );



            res.json(available);


        }

    );


});





app.listen(PORT,()=>{

    console.log(
        `Server running on http://localhost:${PORT}`
    );

});