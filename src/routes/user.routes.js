import express from 'express';
import multer from 'multer';
import { loginUser, logOutUser, refreshAccessToken, registerUser } from '../controllers/user.controllers.js';
// import {upload} from '../middlewares/multer.middleware.js'
import { verifyJWT } from '../middlewares/auth.middlewaress.js';
import { app } from '../app.js';


const router = express.Router();

// Simple multer setup to store file in "uploads" folder
const upload = multer({ dest: 'uploads/' });


router.post(           
  '/register',
  upload.fields([                         
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  registerUser
);


router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT,logOutUser)  

router.route("/Clickhere").post(refreshAccessToken)

export default router;
