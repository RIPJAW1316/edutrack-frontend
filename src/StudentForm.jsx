import { useEffect, useState } from "react";
import axios from "axios";
function StudentForm(){
      const [students,setStudents] = useState([]);
      const [formData,setFormData] = useState({
            id:"",
            name:"",
            age:"",
            email:"",
            course:""
      });
      const [errors,setErrors] = useState({});
      const handleChange = (e)=>{
            const name = e.target.name;
            const value = e.target.value;
            setFormData({
                  ...formData,
                  [name]:value
            });
            setErrors({});
      };
      const getStudents = ()=>{
            axios.get("http://localhost:8080/students")
            .then((response)=>{
                  setStudents(response.data);
            }).catch((error)=>{
                  console.log(error);
            });
      }
      useEffect(()=>{
            getStudents();
      },[]);
      const handleEdit = ((student)=>{
            setFormData({
                  name:student.name,
                  age:student.age,
                  course:student.course,
                  email:student.email
            });
      });
      const handleSubmit =(e)=>{
            e.preventDefault();
            let newerrors = {};
            if(formData.name===""){
                  newerrors.name="Name is Required";
            }
            if(formData.age===""){
                  newerrors.age="Age is Required";
            }
            if(formData.email===""){
                  newerrors.email="Email is Required";
            }
            if(formData.course===""){
                  newerrors.course="Course is Required";
            }
            if(Object.keys(newerrors).length>0){
                  setErrors(newerrors);
                  return;
            }
            if(formData.id===""){
                  axios.post("http://localhost:8080/students",formData)
                  .then((response)=>{
                        console.log(response.data);
                        getStudents();
                        setFormData({
                        id:"",
                        name:"",
                        age:"",
                        email:"",
                        course:""
                  });
                  })
                  .catch((error)=>{
                        console.log(error);
                  });
            }else{
                  axios.put(`http://localhost:8080/students/${formData.id}`,formData)
                  .then((response)=>{
                        console.log(response.data);
                        getStudents();
                        setFormData({
                        id:"",
                        name:"",
                        age:"",
                        email:"",
                        course:""
                  });
                  })
                  .catch((error)=>{
                        console.log(error);
                  });
            }
      };
  return(
    <div>
      <h2>Student Registration Form</h2>

      <form onSubmit={handleSubmit}>
            <label>Name</label>
      <input type="text"
       placeholder="Enter Your Name"
       name="name"
       value={formData.name}
       onChange={handleChange}
       />
       <p>{errors.name}</p>
       <br/>


       <label>Age</label>
      <input type="number"
       placeholder="Enter Your Age"
       name="age"
       value={formData.age}
       onChange={handleChange}    
       />
        <p>{errors.age}</p>
       <br/>


       <label>Course</label>
      <input type="text"
       placeholder="Enter Your Course"
       name="course"
       value={formData.course}
       onChange={handleChange}    
       />
        <p>{errors.course}</p>
       <br/>


       <label>Email</label>
      <input type="email"
       placeholder="Enter Your email"
       name="email"
       value={formData.email}
       onChange={handleChange}    
       />
        <p>{errors.email}</p>
       <br/>
      <button type="submit">{formData.id===""?"Register":"Update"}</button>
      </form>
      
      <table border={1}>
            <thead>
                  <tr>
                        <th>Id</th>
                        <th>Name</th>
                        <th>Age</th>
                        <th>Course</th>
                        <th>Email</th>
                        <th>Action</th>
                  </tr>
            </thead>
            <tbody>
                  {
                        students.map((student)=>(
                              <tr key={student.id}>
                                    <td>{student.id}</td>
                                    <td>{student.name}</td>
                                    <td>{student.age}</td>
                                    <td>{student.course}</td>
                                    <td>{student.email}</td>
                                    <td>
                                          <button onClick={()=>{handleEdit(student)}}>edit</button>
                                          <button>delete</button>
                                    </td>
                              </tr>
                        ))
                  }
            </tbody>
      </table>
    </div>
  );
}
export default StudentForm;