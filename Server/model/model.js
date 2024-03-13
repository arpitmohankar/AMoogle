const mongoose=require("mongoose")
var scheme=new mongoose.Schema(
    {
        active:{
            type:String,
        },
        status:{
            type:String,
        }
    },
    {timestamp:true}
)

const UserDB=mongoose.model("ome",scheme);
module.exports=UserDB;
