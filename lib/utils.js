// generate integer random number between min and max thresholds
function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

// extracts the extentsion from a URI 
function extractMediaExtentionFromURI(URI){
    let extention = "";
    for(let i = URI.length-1;  i >=0; i--){
        console.log(URI.length-1);
        if(URI[i] === '.'){
            break;
        }
        extention+= URI[i];
    }
    return extention.split('').reverse().join('');
}

// extracts media type from a URL 
function extractMediTypeFromURI(URI){
    if(URI.toLowerCase().includes("video")){
        return "video";
    }
    if(URI.toLowerCase().includes("image")){
        return "image";
    }

    if(URI.toLowerCase().includes("audio")){
        return "audio";
    }
    
    return "other";
}


const FieldMapper = (body,fieldsMap)=>{
    let data = {};
    fieldsMap.forEach((field)=>{
        if(body[field]){
            data[field] = body[field];
        }
    });
    return data;
};


module.exports = {
    getRandomNumber,
    extractMediaExtentionFromURI,
    extractMediTypeFromURI,
    FieldMapper
}