require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

const db = require("./database");
const PORT = process.env.PORT || 3000; // Updated to respect Render's dynamic port assignment

const {
    sendBookingNotification,
    sendCustomerConfirmation
} = require("./services/emailService");

const JWT_SECRET = process.env.JWT_SECRET || "freshcut-local-secret-key";
const SESSION_SECRET = process.env.SESSION_SECRET || "freshcut-session-secret";
const PUBLIC_APP_URL = (
    process.env.PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    `http://localhost:${PORT}`
).replace(/\/$/, "");
const PUBLIC_API_BASE_URL = (process.env.PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const hasGoogleOAuth = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const hasFacebookOAuth = Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);

// ==========================
// CORS CONFIGURATION
// ==========================
const allowedOrigins = (process.env.ALLOWED_ORIGINS || PUBLIC_APP_URL)
    .split(",")
    .map(origin => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

function isLocalOrigin(origin) {
    try {
        const { hostname } = new URL(origin);
        return hostname === "localhost" ||
               hostname === "127.0.0.1" ||
               hostname === "::1";
    } catch (error) {
        return false;
    }
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin) || isLocalOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: "lax",
        secure: PUBLIC_APP_URL.startsWith("https://")
    }
}));
app.use(passport.initialize());
app.use(passport.session());
const publicDir = path.join(__dirname, "..");

app.get("/config.js", (req, res) => {
    res.type("application/javascript");
    res.send(
        `window.FRESHCUT_CONFIG=${JSON.stringify({
            apiBaseUrl: PUBLIC_API_BASE_URL
        })};`
    );
});

app.use("/photos", express.static(path.join(publicDir, "photos")));
app.use(express.static(publicDir));


// ==========================
// HOME
// ==========================

app.get("/", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(publicDir, "admin.html"));
});

app.get("/account", (req, res) => {
    res.sendFile(path.join(publicDir, "account.html"));
});

app.get("/api/health", (req, res) => {
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

function readToken(req) {
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return null;
    }

    const token = authHeader.split(" ")[1];

    return token || null;
}

function authenticateAdmin(req,res,next){


    const token = readToken(req);


    if(!token){

        return res.status(401).json({
            message:"No token provided."
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

function authenticateCustomer(req,res,next){


    const token = readToken(req);


    if(!token){

        return res.status(401).json({
            message:"No token provided."
        });

    }


    try{

        const decoded = jwt.verify(
            token,
            JWT_SECRET
        );


        if(decoded.role !== "customer"){

            return res.status(403).json({
                message:"Customer access required."
            });

        }


        req.customer = decoded;

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



    // Monday closed
    if(day === 1){

        return false;

    }


    const endHour = 19;


    const hour = parseInt(time.split(":")[0]);

    const minutes = parseInt(time.split(":")[1]);



    if(hour < 10 || hour >= endHour) {

        return false;

    }


    if(minutes !== 0) {

        return false;

    }


    return true;


}

function normalizePhone(phone) {
    return String(phone || "").replace(/[^\d+]/g, "");
}

function isValidPhone(phone) {
    const normalized = normalizePhone(phone);

    return /^08\d{8}$/.test(normalized) ||
           /^\+3598\d{8}$/.test(normalized) ||
           /^3598\d{8}$/.test(normalized);
}

function isValidEmail(email) {
    const trimmed = String(email || "").trim();

    if (!trimmed) {
        return true;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

function isValidDateString(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(date || ""));
}

function checkClosedDate(date, callback) {
    db.get(
        `
        SELECT *
        FROM closed_dates
        WHERE date = ?
        `,
        [date],
        (err,row)=>{
            callback(err, row || null);
        }
    );
}

function getOptionalCustomerId(req) {
    const token = readToken(req);

    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.role === "customer" ? decoded.id : null;
    } catch (error) {
        return null;
    }
}

function signCustomerToken(customer) {
    return jwt.sign(
        {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            role: "customer"
        },
        JWT_SECRET,
        {
            expiresIn:"30d"
        }
    );
}

function callbackUrl(pathname) {
    return `${PUBLIC_APP_URL}${pathname}`;
}

function socialAuthUnavailable(res, provider) {
    return res.redirect(`/account?authError=${encodeURIComponent(`${provider} login is not configured.`)}`);
}

function finishSocialLogin(res, customer) {
    const token = signCustomerToken(customer);

    return res.redirect(`/account?token=${encodeURIComponent(token)}`);
}

function findOrCreateSocialCustomer(profile, done) {
    const provider = profile.provider;
    const providerId = profile.id;
    const email = String(profile.emails?.[0]?.value || "").trim().toLowerCase();
    const name = profile.displayName || email || `${provider} user`;

    if (!email) {
        return done(null, false, {
            message: "Email permission is required."
        });
    }

    db.get(
        `
        SELECT *
        FROM customers
        WHERE email = ?
        `,
        [email],
        (findErr, existingCustomer)=>{
            if (findErr) {
                return done(findErr);
            }

            if (existingCustomer) {
                db.run(
                    `
                    UPDATE customers
                    SET name = COALESCE(NULLIF(name, ''), ?),
                        auth_provider = ?,
                        provider_id = COALESCE(provider_id, ?)
                    WHERE id = ?
                    `,
                    [
                        name,
                        provider,
                        providerId,
                        existingCustomer.id
                    ],
                    (updateErr)=>{
                        if (updateErr) {
                            return done(updateErr);
                        }

                        return done(null, {
                            id: existingCustomer.id,
                            name: existingCustomer.name || name,
                            email: existingCustomer.email,
                            phone: existingCustomer.phone
                        });
                    }
                );

                return;
            }

            db.run(
                `
                INSERT INTO customers
                (
                    name,
                    email,
                    phone,
                    password,
                    auth_provider,
                    provider_id
                )
                VALUES (?,?,?,?,?,?)
                `,
                [
                    name,
                    email,
                    null,
                    "",
                    provider,
                    providerId
                ],
                function(createErr){
                    if (createErr) {
                        return done(createErr);
                    }

                    return done(null, {
                        id: this.lastID,
                        name,
                        email,
                        phone: null
                    });
                }
            );
        }
    );
}

passport.serializeUser((customer, done) => {
    done(null, customer);
});

passport.deserializeUser((customer, done) => {
    done(null, customer);
});

if (hasGoogleOAuth) {
    passport.use(new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: callbackUrl("/auth/google/callback")
        },
        (accessToken, refreshToken, profile, done) => {
            findOrCreateSocialCustomer(profile, done);
        }
    ));
}

if (hasFacebookOAuth) {
    passport.use(new FacebookStrategy(
        {
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            callbackURL: callbackUrl("/auth/facebook/callback"),
            profileFields: ["id", "displayName", "emails"]
        },
        (accessToken, refreshToken, profile, done) => {
            findOrCreateSocialCustomer(profile, done);
        }
    ));
}


// ==========================
// CUSTOMER AUTH
// ==========================

app.get("/auth/google",(req,res,next)=>{

    if(!hasGoogleOAuth){
        return socialAuthUnavailable(res, "Google");
    }

    return passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false
    })(req,res,next);

});

app.get("/auth/google/callback",(req,res,next)=>{

    if(!hasGoogleOAuth){
        return socialAuthUnavailable(res, "Google");
    }

    passport.authenticate("google", {
        session: false
    }, (err, customer, info)=>{

        if(err || !customer){
            return res.redirect(`/account?authError=${encodeURIComponent(info?.message || err?.message || "Google login failed.")}`);
        }

        return finishSocialLogin(res, customer);

    })(req,res,next);

});

app.get("/auth/facebook",(req,res,next)=>{

    if(!hasFacebookOAuth){
        return socialAuthUnavailable(res, "Facebook");
    }

    return passport.authenticate("facebook", {
        scope: ["email"],
        session: false
    })(req,res,next);

});

app.get("/auth/facebook/callback",(req,res,next)=>{

    if(!hasFacebookOAuth){
        return socialAuthUnavailable(res, "Facebook");
    }

    passport.authenticate("facebook", {
        session: false
    }, (err, customer, info)=>{

        if(err || !customer){
            return res.redirect(`/account?authError=${encodeURIComponent(info?.message || err?.message || "Facebook login failed.")}`);
        }

        return finishSocialLogin(res, customer);

    })(req,res,next);

});

app.post("/customer/register", async (req,res)=>{


    const {
        name,
        email,
        phone,
        password
    } = req.body;


    const cleanEmail = String(email || "").trim().toLowerCase();


    if(!name || !cleanEmail || !password){

        return res.status(400).json({
            message:"Name, email and password are required."
        });

    }


    if(!isValidEmail(cleanEmail)){

        return res.status(400).json({
            message:"Invalid email address."
        });

    }


    if(phone && !isValidPhone(phone)){

        return res.status(400).json({
            message:"Invalid phone number."
        });

    }


    if(String(password).length < 6){

        return res.status(400).json({
            message:"Password must be at least 6 characters."
        });

    }


    const hashedPassword = await bcrypt.hash(password, 10);


    db.run(
        `
        INSERT INTO customers
        (
            name,
            email,
            phone,
            password
        )
        VALUES (?,?,?,?)
        `,
        [
            name,
            cleanEmail,
            phone || null,
            hashedPassword
        ],
        function(err){


            if(err){

                if(err.message.includes("UNIQUE")){

                    return res.status(409).json({
                        message:"A customer with this email already exists."
                    });

                }


                return res.status(500).json({
                    error:err.message
                });

            }


            const customer = {
                id:this.lastID,
                name,
                email:cleanEmail,
                phone:phone || null
            };


            res.json({
                success:true,
                token:signCustomerToken(customer),
                customer
            });


        }
    );


});

app.post("/customer/login",(req,res)=>{


    const {
        email,
        password
    } = req.body;


    const cleanEmail = String(email || "").trim().toLowerCase();


    if(!cleanEmail || !password){

        return res.status(400).json({
            message:"Email and password are required."
        });

    }


    db.get(
        `
        SELECT *
        FROM customers
        WHERE email = ?
        `,
        [cleanEmail],
        async(err, customer)=>{


            if(err){

                return res.status(500).json({
                    error:err.message
                });

            }


            if(!customer || !customer.password){

                return res.status(401).json({
                    message:"Invalid login."
                });

            }


            const valid = await bcrypt.compare(
                password,
                customer.password
            );


            if(!valid){

                return res.status(401).json({
                    message:"Invalid login."
                });

            }


            res.json({
                success:true,
                token:signCustomerToken(customer),
                customer:{
                    id:customer.id,
                    name:customer.name,
                    email:customer.email,
                    phone:customer.phone
                }
            });


        }
    );


});

app.get(
"/customer/me",
authenticateCustomer,
(req,res)=>{


    db.get(
        `
        SELECT id,name,email,phone,created_at
        FROM customers
        WHERE id = ?
        `,
        [req.customer.id],
        (err,customer)=>{


            if(err){

                return res.status(500).json({
                    error:err.message
                });

            }


            if(!customer){

                return res.status(404).json({
                    message:"Customer not found."
                });

            }


            res.json(customer);


        }
    );


});

app.get(
"/customer/appointments",
authenticateCustomer,
(req,res)=>{


    db.all(
        `
        SELECT *
        FROM appointments
        WHERE customer_id = ?
        ORDER BY date,time
        `,
        [req.customer.id],
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

app.put(
"/customer/appointments/:id/cancel",
authenticateCustomer,
(req,res)=>{


    db.run(
        `
        UPDATE appointments
        SET status = 'Cancelled'
        WHERE id = ?
        AND customer_id = ?
        AND status != 'Cancelled'
        `,
        [
            req.params.id,
            req.customer.id
        ],
        function(err){


            if(err){

                return res.status(500).json({
                    error:err.message
                });

            }


            if(this.changes === 0){

                return res.status(404).json({
                    message:"Appointment not found or already cancelled."
                });

            }


            res.json({
                success:true
            });


        }
    );


});


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

    const customerId = getOptionalCustomerId(req);

    if(!name || !phone || !service || !date || !time){

        return res.status(400).json({

            message:"Missing required fields."

        });

    }

    if(!isValidPhone(phone)){

        return res.status(400).json({

            message:"Invalid phone number."

        });

    }

    if(!isValidEmail(email)){

        return res.status(400).json({

            message:"Invalid email address."

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


    checkClosedDate(date, (closedErr, closedDate)=>{


        if(closedErr){

            return res.status(500).json({
                error:closedErr.message
            });

        }


        if(closedDate){

            return res.status(400).json({
                message:"The salon is closed on this date."
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
                    customer_id,
                    name,
                    phone,
                    email,
                    service,
                    date,
                    time,
                    note
                )

                VALUES (?,?,?,?,?,?,?,?)

                `,

                [
                    customerId,
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


                    const booking = {
                        id: this.lastID,
                        name,
                        phone,
                        email,
                        service,
                        date,
                        time,
                        note
                    };


                   console.log("ABOUT TO SEND BARBER EMAIL");

                    sendBookingNotification(booking)
                        .then(() => {
                            console.log("BARBER EMAIL SUCCESS");
                        })
                        .catch(error => {
                            console.log("BARBER EMAIL FAILED:", error);
                        });


                    if(email){

                        sendCustomerConfirmation(booking)
                            .catch(error => {
                                console.log("Customer email error:", error.message);
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
// ADMIN CLOSED DATES
// ==========================

app.get(
"/admin/closed-dates",
authenticateAdmin,
(req,res)=>{


    db.all(
        `
        SELECT *
        FROM closed_dates
        ORDER BY date
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

app.post(
"/admin/closed-dates",
authenticateAdmin,
(req,res)=>{


    const {
        date,
        reason
    } = req.body;


    if(!isValidDateString(date)){

        return res.status(400).json({
            message:"Invalid date."
        });

    }


    db.run(
        `
        INSERT INTO closed_dates
        (
            date,
            reason
        )
        VALUES (?,?)
        ON CONFLICT(date) DO UPDATE SET reason = excluded.reason
        `,
        [
            date,
            reason || null
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

app.delete(
"/admin/closed-dates/:date",
authenticateAdmin,
(req,res)=>{


    const {
        date
    } = req.params;


    if(!isValidDateString(date)){

        return res.status(400).json({
            message:"Invalid date."
        });

    }


    db.run(
        `
        DELETE FROM closed_dates
        WHERE date = ?
        `,
        [date],
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



    // Monday closed
    if(day === 1){

        return [];

    }



    const endHour = 19;


    const slots=[];



    for(let hour=10; hour<endHour; hour++){


        slots.push(
            `${hour}:00`
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

    if(!isValidDateString(date)){

        return res.status(400).json({

            message:"Invalid date."

        });

    }


    checkClosedDate(date, (closedErr, closedDate)=>{

        if(closedErr){

            return res.status(500).json({

                error:closedErr.message

            });

        }


        if(closedDate){

            return res.json([]);

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


});





app.listen(PORT,()=>{

    console.log(
        `Server running on port ${PORT}`
    );

});
