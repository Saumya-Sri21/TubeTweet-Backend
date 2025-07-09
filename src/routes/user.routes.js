import express from 'express';
import multer from 'multer';
import { loginUser, logOutUser, refreshAccessToken, registerUser } from '../controllers/user.controllers.js';
// import {upload} from '../middlewares/multer.middleware.js'
import { verifyJWT } from '../middlewares/auth.middlewaress.js';
import { app } from '../app.js';


const router = express.Router();

// Simple multer setup to store file in "uploads" folder
const upload = multer({ dest: 'uploads/' });

//route for register
router.post(           
  '/register',
  upload.fields([                          // Apply fields for avatar and coverImage
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  registerUser
);

//route for login
router.route("/login").post(loginUser)

//secure routes=routes that work only if logged in

//route for logout (secure routes)
router.route("/logout").post(verifyJWT,logOutUser)   //next use kra tha in verifyJWT taki next logOutUser p vhla jae controller

//route to refresh access token(secured route)
router.route("/Clickhere").post(refreshAccessToken)

export default router;
