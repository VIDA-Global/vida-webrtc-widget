import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";

export default function EmbedSchedulingForm({ agent }) {
  const futureDate = 30;
  const formatPhoneNumber = (phoneNumber) => {
    if (phoneNumber.length < 4) return phoneNumber;
    if (phoneNumber.length < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };
  const [targetAccount, setTargetAccount] = useState({details: {"name": ""}});
  const [loading, setLoading] = useState(false);  
  const [subloading, setSubloading] = useState(false);
  const [apptSuccess, setApptSuccess] = useState(false);
  const [apptCancel, setApptCancel] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    phoneNumber: (Cookies.get("phoneNumber")) ? Cookies.get("phoneNumber") : "",
    formattedPhoneNumber: (Cookies.get("phoneNumber")) ? formatPhoneNumber(Cookies.get("phoneNumber")) : "",
    firstName: "",
    lastName: "",
    email: "",
    vehicle: "",
    serviceType: "",
    transportType: "",
    appointmentDate: "",
    appointmentTime: "",
    comment: "",
  });
  const [manualVehicleInput, setManualVehicleInput] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [filteredAvailability, setFilteredAvailability] = useState([]);
  const [step, setStep] = useState(1);
  const [prevStep, setPrevStep] = useState(1);
  const [allowPhoneEntry, setAllowPhoneEntry] = useState(false);
  const api = axios.create({
    baseURL: "https://api.vida.dev",
    params: {
      targetUser: agent,
    },
  });

  const [showYearOptions, setShowYearOptions] = useState(false);
  const [showMakeOptions, setShowMakeOptions] = useState(false);
  const [showModelOptions, setShowModelOptions] = useState(false);

  const years = ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017"];
  const modelsByMake = {
    "Acura": ["ILX", "MDX", "NSX", "RDX", "RLX", "TLX"],
    "Alfa Romeo": ["Giulia", "Stelvio", "4C", "GTV", "Spider"],
    "Aston Martin": ["DB11", "DBS", "Vantage", "Rapide", "Vanquish"],
    "Audi": ["A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7", "Q8", "R8", "TT"],
    "Bentley": ["Bentayga", "Continental", "Flying Spur", "Mulsanne"],
    "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4", "i3", "i8"],
    "Buick": ["Enclave", "Encore", "Envision", "LaCrosse", "Regal"],
    "Cadillac": ["ATS", "CT4", "CT5", "CT6", "Escalade", "XT4", "XT5", "XT6"],
    "Chevrolet": ["Blazer", "Bolt", "Camaro", "Colorado", "Corvette", "Equinox", "Impala", "Malibu", "Silverado", "Suburban", "Tahoe", "Traverse", "Trax"],
    "Chrysler": ["200", "300", "Pacifica", "Voyager"],
    "Dodge": ["Challenger", "Charger", "Durango", "Grand Caravan", "Journey"],
    "Ferrari": ["488", "812 Superfast", "California", "F8", "GTC4Lusso", "Portofino", "Roma"],
    "Fiat": ["500", "500L", "500X", "124 Spider"],
    "Ford": ["Bronco", "EcoSport", "Edge", "Escape", "Expedition", "Explorer", "F-150", "Fiesta", "Flex", "Focus", "Fusion", "Mustang", "Ranger", "Taurus"],
    "Genesis": ["G70", "G80", "G90"],
    "GMC": ["Acadia", "Canyon", "Savana", "Sierra", "Terrain", "Yukon"],
    "Honda": ["Accord", "Civic", "CR-V", "Fit", "HR-V", "Insight", "Odyssey", "Passport", "Pilot", "Ridgeline"],
    "Hyundai": ["Accent", "Elantra", "Kona", "Palisade", "Santa Fe", "Sonata", "Tucson", "Veloster"],
    "Infiniti": ["Q50", "Q60", "Q70", "QX30", "QX50", "QX60", "QX80"],
    "Jaguar": ["E-PACE", "F-PACE", "F-TYPE", "I-PACE", "XE", "XF", "XJ"],
    "Jeep": ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Renegade", "Wrangler"],
    "Kia": ["Forte", "K5", "Niro", "Optima", "Rio", "Seltos", "Sorento", "Soul", "Sportage", "Stinger", "Telluride"],
    "Land Rover": ["Defender", "Discovery", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"],
    "Lexus": ["ES", "GX", "IS", "LC", "LS", "LX", "NX", "RC", "RX", "UX"],
    "Lincoln": ["Aviator", "Continental", "Corsair", "MKC", "MKT", "MKZ", "Nautilus", "Navigator"],
    "Maserati": ["Ghibli", "GranTurismo", "Levante", "Quattroporte"],
    "Mazda": ["CX-3", "CX-30", "CX-5", "CX-9", "Mazda3", "Mazda6", "MX-5 Miata"],
    "Mercedes-Benz": ["A-Class", "C-Class", "CLA", "CLS", "E-Class", "G-Class", "GLA", "GLB", "GLC", "GLE", "GLS", "S-Class", "SL", "SLC"],
    "Mini": ["Clubman", "Convertible", "Countryman", "Hardtop"],
    "Mitsubishi": ["Eclipse Cross", "Mirage", "Outlander", "Outlander Sport"],
    "Nissan": ["Altima", "Armada", "Frontier", "GT-R", "Kicks", "Leaf", "Maxima", "Murano", "Pathfinder", "Rogue", "Sentra", "Titan", "Versa"],
    "Porsche": ["718 Boxster", "718 Cayman", "911", "Cayenne", "Macan", "Panamera", "Taycan"],
    "Ram": ["1500", "2500", "3500", "ProMaster"],
    "Rolls-Royce": ["Cullinan", "Dawn", "Ghost", "Phantom", "Wraith"],
    "Subaru": ["Ascent", "BRZ", "Crosstrek", "Forester", "Impreza", "Legacy", "Outback", "WRX"],
    "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Roadster"],
    "Toyota": ["4Runner", "Avalon", "Camry", "Corolla", "Highlander", "Land Cruiser", "Prius", "RAV4", "Sequoia", "Sienna", "Tacoma", "Tundra", "Venza", "Yaris"],
    "Volkswagen": ["Arteon", "Atlas", "Beetle", "Golf", "Jetta", "Passat", "Tiguan", "Touareg"],
    "Volvo": ["S60", "S90", "V60", "V90", "XC40", "XC60", "XC90"]
  };
  const makes = Object.keys(modelsByMake);



  const formDataRef = useRef(formData);
  useEffect(() => {
    console.log("formdData changed:")
    console.log(formData)
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    const savedPhoneNumber = Cookies.get("phoneNumber");
    if (savedPhoneNumber && !allowPhoneEntry) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        phoneNumber: savedPhoneNumber,
      }));
      //lookupCustomer(savedPhoneNumber);
    }
  }, [allowPhoneEntry]);

  useEffect(() => {
    if (step && step == 3 && prevStep < step) {
      if(vehicles.length == 1) {
        handleVehicleSelect(vehicles[0].vin)
      }
    }
  }, [step, vehicles]);

  useEffect(() => {
    if (availability.length > 0 && formData.appointmentDate) {
      filterAvailability(formData.appointmentDate);
    }
  }, [availability, formData.appointmentDate]);

  useEffect(() => {
    if (!targetAccount || targetAccount?.details?.name == "Dealer" || targetAccount?.details?.name == "") {
      handleFetchAccount()
    }
  }, []);

  const handleFetchAccount = async () => {
    return fetch(`https://api.vida.dev/api/v1/account/${agent}`)
      .then((res) => {
        if (!res.ok) {
          console.log("Error fetching account!");
        }
        return res.json();
      })
      .then((data) => {
        setTargetAccount(data);
        console.log("Target Account")
        console.log(data)
        return data;
      })
      .catch(function () {
        console.log("Error fetching targetAccount session");
        return false;
      });
  };

  const changeStep = (newStep) => {
    console.log(`old step: ${step}`)
    setPrevStep(step)
    console.log(`new step: ${newStep}`)
    setStep(newStep)
  };

  const handleChange = (e) => {
    console.log("Handling data change")
    const { name, value } = e.target;

    if (name === "phoneNumber") {
      console.log("phone change")
      // Remove all non-numeric characters for the raw phone number
      const rawPhoneNumber = value.replace(/\D/g, "");

      // Format the phone number as (XXX) XXX-XXXX
      const formattedPhoneNumber = formatPhoneNumber(rawPhoneNumber);

      // Update the raw phone number in formData
      setFormData((prevFormData) => ({
        ...prevFormData,
        phoneNumber: rawPhoneNumber,
        formattedPhoneNumber: formattedPhoneNumber,
      }));

      // Update the formatted phone number for display
      //e.target.value = formattedPhoneNumber; // Set the formatted value in the input
    } else {
      // Generic handling for other form fields
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: value,
      }));
    }
  };

  const handleDateChange = async (date, event) => {
    event.stopPropagation(); // Prevent event from bubbling up
    console.log("date")
    console.log(date)
    if (!date || isNaN(date.getTime())) {
      console.error("Invalid date");
      return;
    }
    const formattedDate = moment(date).startOf('day').format("YYYY-MM-DD");
    console.log("formattedDate", formattedDate);
    console.log("Selected Date Object", date);
    console.log("Formatted date parsed back", moment(formattedDate, "YYYY-MM-DD").toDate());
    console.log("Timezone Offset:", date.getTimezoneOffset());
    
    await new Promise((resolve) => {
      setFormData((prevFormData) => {
        const updatedFormData = {
          ...prevFormData,
          appointmentDate: formattedDate,
        };

        formDataRef.current = updatedFormData; // Ensure ref is updated
        resolve();

        return updatedFormData;
      });
    });
    /*
    setFormData((prevFormData) => ({
      ...prevFormData,
      appointmentDate: formattedDate,
    }));
    */
    //filterAvailability(formattedDate, true);
    fetchAvailability();
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    await lookupCustomer(formData.phoneNumber);
  };

  const lookupCustomer = async (phoneNumber) => {
    setLoading(true)
    try {
      const response = await api.post("/api/coxauto/customer", { phoneNumber });
      console.log(response);
      if (
        response.data.success &&
        response.data.customer &&
        response.data.customer.length > 0
      ) {
        const customerData = response.data.customer[0];
        setCustomer(customerData);
        setFormData((prevFormData) => ({
          ...prevFormData,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
        }));
        setVehicles(customerData.vehicles);
        if(customerData?.appointments?.length > 0) {
          changeStep(2);
        }
        else {
          changeStep(3);  
        }
        
      } else {
        changeStep(2);
      }
      Cookies.set("phoneNumber", phoneNumber);
    } catch (error) {
      console.error(error);
    }
    setLoading(false)
  };

  // Add this function inside your component
  const handleVehicleInfoSubmit = (e) => {
    e.preventDefault();

    // Ensure all vehicle fields are filled
    if (formData.vehicleYear && formData.vehicleMake && formData.vehicleModel) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        vehicle: {
          year: formData.vehicleYear,
          make: formData.vehicleMake,
          model: formData.vehicleModel,
        },
      }));

      // Proceed to the next step
      changeStep(4);
    } else {
      alert("Please complete all vehicle fields before proceeding.");
    }
  };

  const handleVehicleSelect = (targetVehicle) => {
    if (targetVehicle === "none") {
      setFormData((prevFormData) => ({
        ...prevFormData,
        vehicle: {vin: null, year: null, make: null, model: null},
      }));
      //changeStep(9); // Go to the new vehicle entry form
      setManualVehicleInput(true);
    } else {
      const selectedVehicle = vehicles.find(
        (vehicle) => vehicle.vin === targetVehicle
      );
      setFormData((prevFormData) => ({
        ...prevFormData,
        vehicle: selectedVehicle,
      }));
      fetchServices(selectedVehicle);
      changeStep(4);
    }
  };

  const fetchServices = async (vehicle) => {
    setLoading(true)
    try {
      const response = await api.post("/api/coxauto/services", { vehicle });
      if (response.data.success) {
        setServices(response.data.services);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false)
  };

  const handleServiceSelect = (serviceId) => {
    console.log("services")
    console.log(services)
    setSelectedService(serviceId);
    if(serviceId == "quickservice") {
      serviceId = services.find(s => s.serviceName && s.serviceName.toLowerCase().includes("minder b"))?.opcode || services.find(s => s.serviceName && s.serviceName.toLowerCase().includes("synthetic oil"))?.opcode;
    }
    else if (serviceId == "recalls") {
      serviceId = services.find(s => s.serviceName && s.serviceName.toLowerCase().includes("recall"))?.opcode;
    }
    else if (serviceId == "other") {
      serviceId = services.find(s => s.serviceName && s.serviceName.toLowerCase().includes("describe what you need"))?.opcode;
    }
    setFormData((prevFormData) => ({
      ...prevFormData,
      serviceType: parseInt(serviceId),
    }));
    console.log(`Set service opcode: ${serviceId}`)
    changeStep(5);
  };

  const handleTransportSelect = async (transportType) => {
    console.log("transportType")
    console.log(transportType)
    /*
    setFormData((prevFormData) => ({
      ...prevFormData,
      transportType: transportType,
    }));
    */
    await new Promise((resolve) => {
      setFormData((prevFormData) => {
        const updatedFormData = {
          ...prevFormData,
          transportType: transportType,
        };

        formDataRef.current = updatedFormData; // Ensure ref is updated
        resolve();

        return updatedFormData;
      });
    });
    //console.log("formData")
    //console.log(formData)
    changeStep(6);
    fetchAvailability();  
  };

  const fetchAvailability = async () => {
    setSubloading(true);
    try {
      // Parse appointmentDate if it exists, otherwise use today's date
      const startDate = formDataRef.current.appointmentDate
        ? moment(formDataRef.current.appointmentDate, "YYYY-MM-DD").format("YYYY-MM-DD")
        : moment().format("YYYY-MM-DD");
        console.log("startDate")
        console.log(startDate)

      // Calculate endDate as one day after the startDate
      const endDate = moment(startDate, "YYYY-MM-DD").add(1, "days").format("YYYY-MM-DD");

      const response = await api.post("/api/coxauto/availability", {
        vehicle: formDataRef.current.vehicle,
        startDate,
        endDate,
        opcode: formDataRef.current.serviceType,
        transportType: formDataRef.current.transportType,
      });

      if (response.data.success) {
        const availableAppointments = response.data.availableAppointments;

        // Find the first afternoon slot (e.g., 12:00 PM or later)
        const afternoonSlot = availableAppointments.find(slot => {
          const slotTime = moment(slot.appointmentDateTimeLocal);
          return slotTime.hours() >= 12; // Checking if the time is 12:00 PM or later
        });

        const selectedDate = formDataRef.current.appointmentDate || startDate;
        const selectedTime = afternoonSlot ? moment(afternoonSlot.appointmentDateTimeLocal).format("HH:mm") : "";

        // Set availability, appointmentDate, and default appointmentTime in one go
        setAvailability(availableAppointments);
        setFormData((prevFormData) => {
          const updatedFormData = {
            ...prevFormData,
            appointmentDate: selectedDate,
            appointmentTime: selectedTime,
            appointmentDateTime: afternoonSlot ? afternoonSlot.appointmentDateTimeLocal : null,
          };
          formDataRef.current = updatedFormData; // Ensure ref is updated
          return updatedFormData;
        });
      }
      else {
        console.log("error")
        console.log(response.data)
      }
    } catch (error) {
      console.error(error);
      console.log("formData");
      console.log(formData);
    }
    setSubloading(false);
  };


  const filterAvailability = async (date, fetch=false) => {
    const filtered = availability.filter(
      (slot) =>
        moment(slot.appointmentDateTimeLocal).format("YYYY-MM-DD") === date
    );
    setFilteredAvailability(filtered);
  };

  const handleAppointmentSelect = async (time) => {
    await new Promise((resolve) => {
      setFormData((prevFormData) => {
        const updatedFormData = {
          ...prevFormData,
          appointmentTime: moment(time).format("HH:mm"),
          appointmentDateTime: time,
        };

        formDataRef.current = updatedFormData; // Ensure ref is updated
        resolve();

        return updatedFormData;
      });
    });
    //
  };

  const keepMeInformed = async () => {
    changeStep(7);
  }

  const reviewAppointmentSlot = async (marketingOptIn) => {
    if(marketingOptIn) {
      console.log("opted into marketing...mark in API")            
    }
    try {
      const markResponse = await api.post("/api/v2/contact", {
        id: formData.phoneNumber,
        name: `${formData.firstName} ${formData.lastName}`,
        email: `${formData.email}`,
        contactSource: "coxauto",
        leadSource: "coxauto",
        marketingOptIn: marketingOptIn
      });
      console.log(markResponse)
    }
    catch(e) {
      console.log("problem storing marketing opt-in value")
      console.log(e)
    }
    changeStep(8);
  }

  const getSelectedService = () => {
    if(!services.length) {
      console.log("no service selected")
      return {"serviceName": ""}
    }
    console.log("services")
    console.log(services)
    const selectedService = services.find(
        (service) => parseInt(service.opcode) === formDataRef.current.serviceType || service.opcode === formDataRef.current.serviceType
      );
    console.log("selectedService")
    console.log(selectedService)
    return selectedService;
  }

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true)
    try {
      const selectedService = services.find(
        (service) => parseInt(service.opcode) === formDataRef.current.serviceType || service.opcode === formDataRef.current.serviceType
      );
      if (!selectedService) {
        console.error("Selected service not found.");
        return;
      }

      const appointmentData = {
        vehicle: formDataRef.current.vehicle,
        appointmentDateTimeLocal: `${formDataRef.current.appointmentDateTime}`,
        customer: customer || {
          firstName: formDataRef.current.firstName,
          lastName: formDataRef.current.lastName,
          emailAddress: formDataRef.current.email,
          phoneNumber: formDataRef.current.phoneNumber,
        },
        comment: formDataRef.current.comment, // Use comment from form data
        services: [
          {
            serviceName: selectedService.serviceName,
            opcode: selectedService.opcode,
            price: selectedService.price,
            comment: selectedService.comment,
          },
        ],
        transportType: formDataRef.current.transportType,
      };

      const response = await api.post("/api/coxauto/book", appointmentData);

      if (response.data.success) {
        //alert("Appointment booked successfully!");
        setApptSuccess(true);
      } else {
        console.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false)
  };

  const handleCancelAppointment = async (appointmentId) => {
    setLoading(true)
    try {
      const response = await api.post("/api/coxauto/cancel", {
        vehicle: customer.vehicles[0], // Assuming the vehicle is the first one in the list
        appointmentId,
        customer: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          emailAddress: customer.email,
          phoneNumber: customer.phone,
        },
        comment: "Customer requested cancellation",
      });

      if (response.data.success) {
        //alert("Appointment cancelled successfully!");
        setApptCancel(true);
        lookupCustomer(formDataRef.current.phoneNumber); // Refresh customer data
      } else {
        console.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false)
  };

  const resetPhoneNumber = () => {
    Cookies.remove("phoneNumber");
    setAllowPhoneEntry(true);
    setFormData((prevFormData) => ({ ...prevFormData, phoneNumber: "" }));
    changeStep(1);
  };

  const goBack = () => {
    changeStep(step - 1);  
  };

  const getTitleDetailsFromStep = () => {
    if(step == 1) {
      return {"title": "Schedule Service", "details": "Let's start with your phone"}
    }
    if(step == 2) {
      return {"title": "Your Information", "details": null}
    }
    if(step == 3) {
      return {"title": "Vehicle", "details": "Which car are we servicing?"}
    }
    if(step == 4) {
      return {"title": "Select Service", "details": "Please select the service you need"}
    }
    if(step == 5) {
      return {"title": "Choose Transport Type", "details": "What are your plans?"}
    }
    if(step == 6) {
      return {"title": "Select Date/Time", "details": null}
    }
    if(step == 7) {
      return {"title": "Keep Me Informed", "details": null}
    }
    if(step == 8) {
      return {"title": "Confirm Appointment", "details": "Please confirm your details."}
    }
  };

  const handleRestart = () => {
    setApptCancel(false);
    setApptSuccess(false);
    window.location.reload()
  }

  const calculateProgress = () => {
    return (step / 8) * 100;
  };

  return (
    <div className="scheduling-form-container">
      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${calculateProgress()}%` }}
          ></div>
        </div>
      </div>
      <div className="scheduling-form-body"> 
        {loading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        )}
        {apptSuccess && (
          <div className="apptSuccess-container">
            <h2 className="theme-clr h33">Appointment Successfully Booked!</h2>
            <div style={{"marginTop": "10px", "marginBottom": "20px"}}>Your appointment has been reserved.</div>
            <button className="sub-btn theme-btn" type="button" onClick={handleRestart}>
              New Booking
            </button>
          </div>
        )}
        {apptCancel && (
          <div className="apptCancel-container">
            <h2 className="theme-clr h33">Appointment Successfully Cancelled!</h2>
            <div style={{"marginTop": "10px", "marginBottom": "20px"}}>Your appointment has been cancelled.</div>
            <button className="sub-btn theme-btn" type="button" onClick={handleRestart}>
              New Booking
            </button>
          </div>
        )}
        {!loading && !apptSuccess && !apptCancel && (
          <>
            <div className="header">
              <div className="headerName">{`${targetAccount?.details.name}`}</div>
              <div className="flexbtn">              
                {step !== 1 &&              
                <div type="button" onClick={goBack} className="back-button btn btn-link">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="bi bi-chevron-left back-button-img">
                    <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"></path>
                  </svg>
                </div>
                }
                <div>
                  <h2 className="theme-clr h33">{getTitleDetailsFromStep().title}</h2>
                  <h5 className="theme-clr h55">{getTitleDetailsFromStep().details}</h5>
                </div>
              </div>
              <hr className="hr" />
            </div>
            {step === 1 && (
              <form onSubmit={handlePhoneSubmit}>
                <label>
                  {/* Phone Number: */}
                  <input
                    type="tel"
                    className="inp-ctrl"
                    name="phoneNumber"
                    value={formData.formattedPhoneNumber}
                    onChange={handleChange}
                    required
                  />
                </label>
                <div className="text-medium">{`By using this service, I agree that ${targetAccount?.details.name} may use my information in ${targetAccount?.details.name}’s system and the information I enter to schedule service.`} <a href={`${(targetAccount?.details?.privacyUrl) ? targetAccount?.details?.privacyUrl : "https://vida.io/privacy"}`} style={{"color": "#000"}}>Privacy Policy</a></div>
                <button className="sub-btn theme-btn" type="submit" disabled={!formData.phoneNumber}>
                  Lookup
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={() => changeStep(3)}>
                {customer.appointments && 
                <>
                {customer.appointments.map((appointment) => (

                    <div key={appointment.confKey} className="notice appointment">
                      <p>
                        <div className="text-center mb-5"><strong >Existing Appointment</strong></div>
                        <div><strong>Date:</strong> {moment(formDataRef.current.appointmentDateTime).format("ddd, MMM D, h:mm A")}</div>
                        <div><strong>Service:</strong>{" "}
                        {appointment.services
                          .map((service) => service.serviceName)
                          .join(", ")}
                        <br />
                        </div>
                        <div><strong>Transport Type:</strong>{" "}
                        {(appointment.transportType == "WAITER") ? "Waiting at the dealership" : "Dropping your vehicle off"}</div>
                      </p>
                      <button
                        className="sub-btn secondary"
                        onClick={() => handleCancelAppointment(appointment.confKey)}
                      >
                        Cancel Appointment
                      </button>
                    </div>
                  ))}
                </>
                }
                <hr className="hr" />
                <div className="flexbtna">
                  <label>
                    <input
                      type="text"
                      name="firstName"
                      value={formDataRef.current.firstName}
                      onChange={handleChange}
                      required
                      className="inp-ctrl"
                      placeholder="First Name"
                    />
                  </label>
                  <label>
                    <input
                      type="text"
                      name="lastName"
                      value={formDataRef.current.lastName}
                      onChange={handleChange}
                      required
                      className="inp-ctrl"
                      placeholder="Last Name"
                    />
                  </label>
                </div>
                <label>
                  <input
                    type="email"
                    name="email"
                    className="inp-ctrl"
                    placeholder="Email"
                    value={formDataRef.current.email}
                    onChange={handleChange}
                    required
                  />
                </label>
                <div className="text-medium">We use your email to send confirmations and reminders. We'll never share your email with anyone else.</div>            
                <button type="submit" className=" sub-btn theme-btn">
                  Next
                </button>
                {/* <button type="button" className="secondary">
                  Go Back
                </button> */}
              </form>
            )}

            {step === 3 && (
              <>
              {!manualVehicleInput && 
              <form onSubmit={() => changeStep(4)}>          
                <div className="Appointment">
                  {vehicles.map((vehicle, index) => (
                    <div key={`vehicle-${index}`} className="wait-drop ml-0 mr-0 justify-content-md-center text-left row" onClick={(e) => handleVehicleSelect(vehicle.vin)}>
                      <div className=" pointer blink-border transportation-type bg-white col-md-10 col-lg-10 col-xl-10 color-primary m-2 box-style p-2 rounded-box box-border col">
                        <div id="WAITER" className="pl-1 pt-3 pb-0 pr-3">
                          <h5 className="text-dark fw-bold description">
                            {vehicle.year} {vehicle.make} {vehicle.model} 
                          </h5>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="wait-drop  ml-0 mr-0 justify-content-md-center text-left row" onClick={(e) => handleVehicleSelect("none")}>
                    <div className=" pointer blink-border transportation-type bg-white col-md-10 col-lg-10 col-xl-10 color-primary m-2 box-style p-2 rounded-box box-border col">
                      <div id="DROPOFF" className="pl-1 pt-3 pb-0 pr-3">
                        <h5 className="text-dark fw-bold description">None of the above</h5>
                        <hr className="mt-0 mb-0 hra  " />
                        <span className="text-muted text-smallish comment">
                          Input a new vehicle.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
              }
              {manualVehicleInput && 
              <>          
                <form onSubmit={handleVehicleInfoSubmit}>
                  {/* Typeahead for Vehicle Year */}
                  <label>
                    <input
                      type="text"
                      name="vehicleYear"
                      value={formData.vehicleYear}
                      onChange={handleChange}
                      onFocus={() => setShowYearOptions(true)}
                      onBlur={() => setTimeout(() => setShowYearOptions(false), 100)} // Delay to allow selection
                      className="inp-ctrl"
                      placeholder="Year"
                      autoComplete="off"
                    />
                    {showYearOptions && (
                      <div className="dropdown">
                        {years
                          .filter((year) => year.startsWith(formData.vehicleYear || ""))
                          .map((year) => (
                            <div
                              key={year}
                              onMouseDown={() => setFormData((prevFormData) => ({ ...prevFormData, vehicleYear: year }))}
                              className="dropdown-item"
                            >
                              {year}
                            </div>
                          ))}
                      </div>
                    )}
                  </label>

                  {/* Typeahead for Vehicle Make */}
                  <label>
                    <input
                      type="text"
                      name="vehicleMake"
                      value={formData.vehicleMake}
                      onChange={(e) => {
                        handleChange(e);
                        setShowMakeOptions(true);
                        setFormData((prevFormData) => ({
                          ...prevFormData,
                          vehicleModel: "", // Clear model when make changes
                        }));
                      }}
                      onFocus={() => setShowMakeOptions(true)}
                      onBlur={() => setTimeout(() => setShowMakeOptions(false), 100)} // Delay to allow selection
                      className="inp-ctrl"
                      placeholder="Make"
                      autoComplete="off"
                    />
                    {showMakeOptions && (
                      <div className="dropdown">
                        {makes
                          .filter((make) =>
                            make.toLowerCase().startsWith((formData.vehicleMake || "").toLowerCase())
                          )
                          .map((make) => (
                            <div
                              key={make}
                              onMouseDown={() => setFormData((prevFormData) => ({ ...prevFormData, vehicleMake: make }))}
                              className="dropdown-item"
                            >
                              {make}
                            </div>
                          ))}
                      </div>
                    )}
                  </label>
                  <label>
                    <input
                      type="text"
                      name="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={handleChange}
                      onFocus={() => setShowModelOptions(true)}
                      onBlur={() => setTimeout(() => setShowModelOptions(false), 100)} // Delay to allow selection
                      className="inp-ctrl"
                      placeholder="Model"
                      autoComplete="off"
                      disabled={!formData.vehicleMake} // Disable model input until make is selected
                    />
                    {showModelOptions && formData.vehicleMake && (
                      <div className="dropdown">
                        {modelsByMake[formData.vehicleMake] &&
                          modelsByMake[formData.vehicleMake]
                            .filter((model) =>
                              model.toLowerCase().startsWith((formData.vehicleModel || "").toLowerCase())
                            )
                            .map((model) => (
                              <div
                                key={model}
                                onMouseDown={() => setFormData((prevFormData) => ({ ...prevFormData, vehicleModel: model }))}
                                className="dropdown-item"
                              >
                                {model}
                              </div>
                            ))}
                      </div>
                    )}
                  </label>

                  <button type="submit" className=" sub-btn theme-btn">
                    Next
                  </button>
                  <button type="button" className="secondary sub-btn" onClick={() => setManualVehicleInput(false)}>Back to Vehicles</button>
                </form>
                </>
              }
              </>
            )}

            {step === 4 && (
              <form onSubmit={() => changeStep(5)}>
                <div className="Appointment">
                  <div className="ml-0 mr-0 justify-content-md-center rowm">
                    <div
                      id="QUICK SERVICE"
                      className=" pointer blink-border service-type bg-white col-5 col-md-2 col-lg-2 col-xl-2 color-primary m-2 box-style p-2 rounded-box box-border col"                
                      onClick={(e) => handleServiceSelect("quickservice")}
                    >
                      <div
                        id="QUICK SERVICE"
                        className="service-type-container pl-1 pt-3 pb-0 pr-3 text-center"
                      >
                        <img
                          id="QUICK SERVICE"
                          height={100}
                          width={100}
                          src="//cdn.blinkai.com/service_types/oil_change.svg"
                          className="mb-5 img-60"
                        />
                        <div className="text-muted" style={{ lineHeight: "1rem" }}>
                          <h6 id="QUICK SERVICE" className="text-center text-dark">
                            Oil Change / Quick Service
                          </h6>
                        </div>
                      </div>
                    </div>
                    <div
                      id="RECALL"
                      className=" pointer blink-border service-type bg-white col-5 col-md-2 col-lg-2 col-xl-2 color-primary m-2 box-style p-2 rounded-box box-border col"
                      onClick={(e) => handleServiceSelect("recalls")}
                    >
                      <div id="RECALL" className="service-type-container pl-1 pt-3 pb-0 pr-3 text-center">
                        <img
                          id="RECALL"
                          height={100}
                          width={100}
                          src="//cdn.blinkai.com/service_types/check_engine.svg"
                          className="mb-5 img-60"
                        />
                        <div className="text-muted" style={{ lineHeight: "1rem" }}>
                          <h6 id="RECALL" className="text-center text-dark">
                            Recalls
                          </h6>
                        </div>
                      </div>
                    </div>
                    <div
                      id="OTHER SERVICE"
                      className=" pointer blink-border service-type bg-white col-5 col-md-2 col-lg-2 col-xl-2 color-primary m-2 box-style p-2 rounded-box box-border col"
                      onClick={(e) => handleServiceSelect("other")}
                    >
                      <div
                        id="OTHER SERVICE"
                        className="service-type-container pl-1 pt-3 pb-0 pr-3 text-center"
                      >
                        <img
                          id="OTHER SERVICE"
                          height={100}
                          width={100}
                          src="//cdn.blinkai.com/service_types/other.svg"
                          className="mb-5 img-60"
                        />
                        <div className="text-muted" style={{ lineHeight: "1rem" }}>
                          <h6 id="OTHER SERVICE" className="text-center text-dark">
                            Repairs / Other Concerns
                          </h6>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* <button type="submit" className=" sub-btn theme-btn">
                  Continue
                </button> */}
              </form>
            )}

            {step === 5 && (
              <form onSubmit={() => changeStep(6)}>
                <div className="Appointment">
                  <div className="wait-drop ml-0 mr-0 justify-content-md-center text-left row" onClick={(e) => handleTransportSelect("WAITER")}>
                    <div className=" pointer blink-border transportation-type bg-white col-md-10 col-lg-10 col-xl-10 color-primary m-2 box-style p-2 rounded-box box-border col">
                      <div id="WAITER" className="pl-1 pt-3 pb-0 pr-3">
                        <h5 className="text-dark fw-bold description">
                          WAIT AT DEALERSHIP
                        </h5>
                        <hr className="mt-0 mb-0 hra" />
                        <span className="text-muted text-smallish comment">
                          Our Waiting Area has WiFi Internet
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="wait-drop  ml-0 mr-0 justify-content-md-center text-left row" onClick={(e) => handleTransportSelect("DROPOFF")}>
                    <div className=" pointer blink-border transportation-type bg-white col-md-10 col-lg-10 col-xl-10 color-primary m-2 box-style p-2 rounded-box box-border col">
                      <div id="DROPOFF" className="pl-1 pt-3 pb-0 pr-3">
                        <h5 className="text-dark fw-bold description">DROP OFF</h5>
                        <hr className="mt-0 mb-0 hra  " />
                        <span className="text-muted text-smallish comment">
                          Transportation is not required during the service appointment.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {step === 6 && (
              <div className="Appointment">
              <div className="date-time-container">
                {subloading && (
                  <div className="loading-indicator lower">
                    <div className="spinner"></div>
                    <p>Loading...</p>
                  </div>
                )}
                <div className="calendar-container">
                  {selectedService == "quickservice" && <div className="notice">Mornings are often busy with customers dropping off cars. If you intend to wait at the dealership, please note that afternoon appointments typically have shorter wait times.</div>}
                  {selectedService == "recalls" && <div className="notice">When scheduling your RECALL, please understand that some RECALLS require for your vehicle to be inspected and parts to be ordered which could generate a second visit. We apologize in advance for this inconvenience.</div>}
                  {selectedService == "other" && <div className="notice">If your vehicle needs DIAGNOSTICS beyond general repair, This could take 24-48 hours. Thank you for your patience.</div>}
                  <div className="flex-te">                         
                      <DatePicker
                        selected={formData.appointmentDate ? moment(formData.appointmentDate).toDate() : null}
                        //selected={formData.appointmentDate ? new Date(formData.appointmentDate) : null}                
                        onChange={handleDateChange}
                        dateFormat="yyyy-MM-dd"
                        minDate={new Date()}
                        maxDate={moment().add(90, "days").toDate()}
                        required
                        inline
                        utcOffset={moment().utcOffset()}
                        filterDate={(date) => date.getDay() !== 0} // Disables Sundays (0 is Sunday in getDay())
                        //onMonthChange={(date) => handleDateChange(date)} // This handles month changes
                        //onYearChange={(date) => handleDateChange(date)} // This handles year changes
                      />

                    <div className="time-slots-container">
                      <div className="react-datepicker__time-container ">
                        <div className="react-datepicker__header react-datepicker__header--time ">
                          <div className="react-datepicker-time__header">Time</div>
                        </div>
                        <div className="react-datepicker__time">
                          <div className="react-datepicker__time-box" style={{"position": "relative"}}>
                            <ul
                              className="react-datepicker__time-list"
                              role="listbox"
                              aria-label="Time"
                            >
                            {filteredAvailability.map((slot) => (
                              <li
                                key={slot.appointmentDateTimeLocal}
                                className={`react-datepicker__time-list-item  ${formDataRef.current.appointmentDateTime == slot.appointmentDateTimeLocal ? "react-datepicker__time-list-item--selected" : ""}`}
                                tabIndex={-1}
                                role="option"
                                aria-disabled="true"
                                //onClick={slot.appointmentDateTimeLocal}
                                onClick={(e) => handleAppointmentSelect(slot.appointmentDateTimeLocal)}
                              >
                              {moment(slot.appointmentDateTimeLocal).format("h:mm A")}
                              </li>
                            ))}
                            </ul>
                          </div>
                        </div>
                      </div>                
                    </div>
                    
                  </div>
                  {formDataRef?.current?.appointmentDateTime && 
                  <>
                  <div className="date-footer theme-clr">{moment(formDataRef.current.appointmentDateTime).format("ddd, MMM D, h:mm A")}</div>
                    <button type="submit" className=" sub-btn theme-btn" onClick={keepMeInformed}>
                    Review
                    </button>
                  </>
                  }
                </div>
                {/* <button type="button" onClick={goBack}>
                  Go Back
                </button> */}
              </div>
              </div>
            )}
            {step === 7 && (
              <div className="Appointment">
                <form onSubmit={handleAppointmentSubmit}>
                  <h3>{`Stay informed about your service visits, special deals and important updates about your car from ${`${targetAccount?.details?.name}`}.`}</h3>
                  <div className="text-medium">{`By clicking the "KEEP ME INFORMED" button, you are agreeing to receive up to three automated reminders and/or marketing messages per month from us at the phone number you provide. Your consent is not a condition of making any purchase. Message and data rates may apply.`}</div>
                  <button type="submit" className=" sub-btn theme-btn" onClick={() => reviewAppointmentSlot(true)}>Keep Me Informed</button>
                  <button type="button" className="secondary sub-btn" onClick={() => reviewAppointmentSlot(false)}>No Thanks</button>
                </form>
              </div>
            )}

            {step === 8 && (
              <div className="Appointment">
              <form onSubmit={handleAppointmentSubmit}>
                <div style={{"float": "left", "margin-right": "25px", "min-height": "300px"}}>
                  <div className="date"><span className="binds"></span><span className="month" id="summary-month">August</span><div className="day-box"><h1 className="day" id="summary-day">16</h1><small className="dayOfWeek" id="summary-dayOfWeek">Friday</small></div><span className="time" id="summary-time">9:30 AM</span></div>
                </div>
                <div>
                  <div className="theme-clr">
                    {formData.firstName} {formData.lastName}
                  </div>
                  <div className="theme-clr">
                    {formatPhoneNumber(formData.phoneNumber)}
                  </div>
                  <hr className="hr" />
                  <div>
                    <strong>Date:</strong> {moment(formDataRef.current.appointmentDateTime).format("ddd, MMM D, h:mm A")}
                  </div>
                  <div>
                    <strong>Service:</strong> {getSelectedService().serviceName}
                  </div>
                  <div>
                    <strong>Transport Type:</strong> {(formDataRef.current.transportType == "WAITER") ? "Waiting at the dealership" : "Dropping your vehicle off"}
                  </div>
                  <div className="comments">
                    <label>
                      <p className="cmt-er"> Is there anything you want to tell us about this service visit? Let us know in the comments!</p>
                      <textarea
                        name="comment"
                        className="cmt"
                        value={formData.comment}
                        onChange={handleChange}
                        placeholder="Share additional comments or information."
                      ></textarea>
                    </label>
                  </div>
                </div>
                <button type="submit" className=" sub-btn theme-btn">
                  Book Now
                </button>          
              </form>
              </div>
            )}
          </>
        )}
      </div>
      <div className="footer">
        <div className="vidaLogo">
          <a href="https://vida.io" target="_blank" className="poweredBy">
              <span className="poweredByBlurb">Powered by</span>
              <svg width="96" height="24" viewBox="0 0 800 200" fill="#000" xmlns="http://www.w3.org/2000/svg"><path d="M478.576 37C478.576 33.6863 475.89 31 472.576 31H454.647C451.333 31 448.647 33.6863 448.647 37V162.946C448.647 166.26 451.333 168.946 454.647 168.946H472.576C475.89 168.946 478.576 166.26 478.576 162.946V37Z" className="fill-current"></path><path d="M299 112.466V37C299 33.6863 301.686 31 305 31H322.534C325.848 31 328.534 33.6863 328.534 37V102.492C328.534 108.423 331.577 113.985 336.696 117.414L358.995 132.347C363.525 135.38 369.601 135.333 374.078 132.23L395.432 117.427C400.402 113.983 403.338 108.506 403.338 102.681V37C403.338 33.6863 406.024 31 409.338 31H427.259C430.572 31 433.259 33.6863 433.259 37V112.48C433.259 120.06 429.529 127.209 423.167 131.824L377.959 164.613C371.018 169.647 361.366 169.651 354.42 164.623L309.111 131.824C302.738 127.21 299 120.054 299 112.466Z" className="fill-current"></path><path d="M774 87.5338V163C774 166.314 771.314 169 768 169H750.466C747.152 169 744.466 166.314 744.466 163V97.5076C744.466 91.5771 741.423 86.0148 736.304 82.5864L714.005 67.6534C709.475 64.6198 703.399 64.6667 698.922 67.7701L677.568 82.5726C672.598 86.0173 669.663 91.4938 669.663 97.3188V163C669.663 166.314 666.976 169 663.663 169H645.741C642.428 169 639.741 166.314 639.741 163V87.5197C639.741 79.9396 643.471 72.7906 649.833 68.1761L695.041 35.3874C701.982 30.353 711.634 30.3488 718.58 35.3771L763.889 68.1765C770.262 72.7902 774 79.9457 774 87.5338Z" className="fill-current"></path><path fillRule="evenodd" clipRule="evenodd" d="M499.617 168.879C496.303 168.879 493.617 166.193 493.617 162.879V37.1219C493.617 33.8082 496.303 31.1219 499.617 31.1219H592.796C610.603 31.1219 625.039 44.767 625.039 61.5992V138.402C625.039 155.234 610.603 168.879 592.796 168.879H499.617ZM523.151 140.596V59.2829H582.349C589.472 59.2829 595.246 64.741 595.246 71.4738V128.405C595.246 135.138 589.472 140.596 582.349 140.596H523.151Z" className="fill-current"></path><path fillRule="evenodd" clipRule="evenodd" d="M82.1911 7.98047C87.8114 7.98047 92.3676 12.2875 92.3676 17.6005V181.14C92.3676 186.453 87.8114 190.76 82.1911 190.76H71.4927C65.8724 190.76 61.3163 186.453 61.3163 181.14V17.6005C61.3163 12.2875 65.8724 7.98047 71.4927 7.98047H82.1911ZM129.507 7.98047C135.128 7.98047 139.684 12.2875 139.684 17.6005V181.14C139.684 186.453 135.128 190.76 129.507 190.76H118.809C113.189 190.76 108.632 186.453 108.632 181.14V17.6005C108.632 12.2875 113.189 7.98047 118.809 7.98047H129.507ZM34.8748 43.5256C40.4951 43.5256 45.0513 47.8326 45.0513 53.1456L45.0513 142.876C45.0513 148.189 40.4952 152.496 34.8749 152.496L24.1765 152.496C18.5562 152.496 14 148.189 14 142.876L14 53.1456C14 47.8326 18.5562 43.5256 24.1765 43.5256L34.8748 43.5256ZM176.824 43.5256C182.444 43.5256 187 47.8326 187 53.1456L187 142.876C187 148.189 182.444 152.496 176.824 152.496L166.125 152.496C160.505 152.496 155.949 148.189 155.949 142.876L155.949 53.1456C155.949 47.8326 160.505 43.5256 166.125 43.5256L176.824 43.5256Z" className="fill-current"></path></svg>
          </a>
        </div>
        <div className="accountDetails">
          <div className="accountName">{`${targetAccount?.details?.name}`}</div>
          <div className="privacy"><a href={`${(targetAccount?.details?.privacyUrl) ? targetAccount?.details?.privacyUrl : "https://vida.io/privacy"}`} target="_blank">Privacy Policy</a></div>
        </div>        
      </div>
    </div>
  );
}