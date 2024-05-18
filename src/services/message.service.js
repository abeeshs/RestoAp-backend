const AWS = require('aws-sdk');

// Configure AWS credentials
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION, // Replace with your desired AWS region
});

const sendMessage = (params) => {
  const sns = new AWS.SNS();

  sns.publish(params, (err, data) => {
    if (err) {
      console.error('Error sending SNS message:', err);
    } else {
      console.log('Message sent successfully:', data);
    }
  });
};

const sendOTP = (phoneNumber, otp) => {
  // const otp = generateOTP();
  const params = {
    Message: `Hello from AWS SNS! latest test ${otp}`, // Replace with your desired message
    PhoneNumber: `+91${phoneNumber}`, // Replace with the phone number you want to send the message to
    // PhoneNumber: "+918761971472", // Replace with the phone number you want to send the message to
  };
  sendMessage(params);
};

module.exports = { sendOTP };
