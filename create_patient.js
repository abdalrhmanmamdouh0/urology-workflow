(async () => {
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsIm5hbWUiOiJEci4gQWhtZWQgKEFkbWluKSIsImlhdCI6MTc4MDA0MzMyNSwiZXhwIjoxNzgwNjQ4MTI1fQ.Otp8UdTk-TQQj4y2qKptOQHGJywUm55fTBPFzI5lBoA";
  const patient = {
    serial_number: "U001",
    name_en: "John Doe",
    name_ar: "جون دو",
    age: 45,
    weight: 70,
    diagnosis_en: "Kidney stone",
    diagnosis_ar: "حصوة كلى",
    operation_en: "PCNL",
    operation_ar: "PCNL",
    room: "101",
    surgeon: "Dr. Ahmed",
    status: "Waiting"
  };
  const res = await fetch("http://localhost:5001/api/patients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(patient)
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
})();
