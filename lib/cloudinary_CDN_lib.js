const cloudinary = require('cloudinary')


// this function configures the cloudinary CDN it just needs to be called once before using any of the below functions
const configCloudinary = () => {
    cloudinary.v2.config({
        cloud_name: 'dsjgnprbs',
        api_key: '721488549146314',
        api_secret: 'LcUtuupvY8xZyUnI7L2nehOs76I',
        secure: true,
    });
}

// use this function to upload images to the cloudinary CDN providing the img path
const uploadImage = async (imagePath) => {
    const options = {
        use_filename: true,
        unique_filename: false,
        overwrite: true,
    };

    try {
        // Upload the image
        const result = await cloudinary.uploader.upload(imagePath, options);
        console.log(`image uploaded to cloudinary image public id :${result.public_id}`);
        console.log(result);
        return result.public_id;
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    configCloudinary,
    uploadImage
};