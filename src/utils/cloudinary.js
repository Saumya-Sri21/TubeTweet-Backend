import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'   //file system->use to read write open and all funct of file can be done by it..node k sath hi hota h

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_NAME, 
        api_key: process.env.CLOUDINARY_KEY, 
        api_secret: process.env.CLOUDINARY_SECRET 
    });

//to upload files on cloudinary
const uploadFileonCloud= async(localFile)=>{

    try {
        if(!localFile) return null;

        const response= await cloudinary.uploader.upload(localFile,
            {
                resource_type:'auto'
            })
        console.log(`File Uploaded Successfully!!`);
        fs.unlinkSync(localFile)
        return response;
        
    } catch (error) {
        fs.unlinkSync(localFile)   //remove the locally saved temporary file as the upload operation got failed
        return null;
        
    }

}

export {uploadFileonCloud}