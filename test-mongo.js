const mongoose = require('mongoose');
const uri = "mongodb+srv://abhishekzobin02052000_db_user:%40HERO%401234@cluster0.lndgnwb.mongodb.net/dsa-tracker?appName=Cluster0";

mongoose.connect(uri)
  .then(() => {
    console.log("SUCCESSFULLY CONNECTED TO MONGODB");
    process.exit(0);
  })
  .catch(err => {
    console.error("MONGODB CONNECTION ERROR:", err.message);
    process.exit(1);
  });
