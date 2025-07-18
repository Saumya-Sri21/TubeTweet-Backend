import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'   

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_NAME, 
        api_key: process.env.CLOUDINARY_KEY, 
        api_secret: process.env.CLOUDINARY_SECRET 
    });


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
        fs.unlinkSync(localFile)   
        return null;
        
    }

}

export {uploadFileonCloud}
