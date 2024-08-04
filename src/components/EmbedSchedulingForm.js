import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";

export default function EmbedSchedulingForm({ agent }) {
  const [formData, setFormData] = useState({
    phoneNumber: "",
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
  const [customer, setCustomer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [filteredAvailability, setFilteredAvailability] = useState([]);
  const [step, setStep] = useState(1);
  const [allowPhoneEntry, setAllowPhoneEntry] = useState(false);
  const api = axios.create({
    baseURL: "https://api.vida.dev",
    params: {
      targetUser: agent,
    },
  });

  useEffect(() => {
    const savedPhoneNumber = Cookies.get("phoneNumber");
    if (savedPhoneNumber && !allowPhoneEntry) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        phoneNumber: savedPhoneNumber,
      }));
      lookupCustomer(savedPhoneNumber);
    }
  }, [allowPhoneEntry]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
  };

  const handleDateChange = (date) => {
    if (!date || isNaN(date.getTime())) {
      console.error("Invalid date");
      return;
    }
    setFormData((prevFormData) => ({
      ...prevFormData,
      appointmentDate: moment(date).format("YYYY-MM-DD"),
    }));
    filterAvailability(moment(date).format("YYYY-MM-DD"));
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    await lookupCustomer(formData.phoneNumber);
  };

  const lookupCustomer = async (phoneNumber) => {
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
        setStep(customerData.appointments.length > 0 ? 8 : 3); // Step 8 to show appointments if there are any
        // setStep(8); // Step 8 to show appointments if there are any
      } else {
        setStep(2);
      }
      Cookies.set("phoneNumber", phoneNumber);
    } catch (error) {
      console.error(error);
    }
  };

  const handleVehicleSelect = (e) => {
    const selectedVehicle = vehicles.find(
      (vehicle) => vehicle.vin === e.target.value
    );
    setFormData((prevFormData) => ({
      ...prevFormData,
      vehicle: selectedVehicle,
    }));
    fetchServices(selectedVehicle);
    setStep(4);
  };

  const fetchServices = async (vehicle) => {
    try {
      const response = await api.post("/api/coxauto/services", { vehicle });
      if (response.data.success) {
        setServices(response.data.services);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleServiceSelect = (e) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      serviceType: e.target.value,
    }));
    setStep(5);
  };

  const handleTransportSelect = async (e) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      transportType: e.target.value,
    }));
    setStep(6);
    await fetchAvailability();
  };

  const fetchAvailability = async () => {
    try {
      const startDate = moment().format("YYYY-MM-DD");
      const endDate = moment().add(6, "days").format("YYYY-MM-DD");

      const response = await api.post("/api/coxauto/availability", {
        vehicle: formData.vehicle,
        startDate,
        endDate,
        opcode: formData.serviceType,
        transportType: formData.transportType,
      });

      if (response.data.success) {
        setAvailability(response.data.availableAppointments);
        filterAvailability(formData.appointmentDate);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filterAvailability = (date) => {
    const filtered = availability.filter(
      (slot) =>
        moment(slot.appointmentDateTimeLocal).format("YYYY-MM-DD") === date
    );
    setFilteredAvailability(filtered);
  };

  const handleAppointmentSelect = (e) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      appointmentTime: e.target.value,
    }));
    setStep(7);
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedService = services.find(
        (service) => service.opcode === formData.serviceType
      );
      if (!selectedService) {
        console.error("Selected service not found.");
        return;
      }

      const appointmentData = {
        vehicle: formData.vehicle,
        appointmentDateTimeLocal: `${formData.appointmentDate}T${formData.appointmentTime}`,
        customer: customer || {
          firstName: formData.firstName,
          lastName: formData.lastName,
          emailAddress: formData.email,
          phoneNumber: formData.phoneNumber,
        },
        comment: formData.comment, // Use comment from form data
        services: [
          {
            serviceName: selectedService.serviceName,
            opcode: selectedService.opcode,
            price: selectedService.price,
            comment: selectedService.comment,
          },
        ],
        transportType: formData.transportType,
      };

      const response = await api.post("/api/coxauto/book", appointmentData);

      if (response.data.success) {
        alert("Appointment booked successfully!");
      } else {
        console.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
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
        alert("Appointment cancelled successfully!");
        lookupCustomer(formData.phoneNumber); // Refresh customer data
      } else {
        console.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const resetPhoneNumber = () => {
    Cookies.remove("phoneNumber");
    setAllowPhoneEntry(true);
    setFormData((prevFormData) => ({ ...prevFormData, phoneNumber: "" }));
    setStep(1);
  };

  const goBack = () => {
    if (step === 2) {
      resetPhoneNumber();
    } else {
      setStep(step - 1);
    }
  };

  return (
    <div className="scheduling-form-container">
      {step === 1 && (
        <form onSubmit={handlePhoneSubmit}>
          <h2 className="theme-clr h33">Schedule Service</h2>
          <h5 className="theme-clr h55">Let's start with your phone</h5>
          <hr className="hr" />
          <label>
            {/* Phone Number: */}
            <input
              type="tel"
              className="inp-ctrl"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
          </label>
          <button className="sub-btn theme-btn" type="submit">
            Lookup
          </button>
          <button
            type="button"
            className="secondary sub-btn"
            onClick={resetPhoneNumber}
          >
            Enter a new phone number
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={() => setStep(3)}>
          <div className="flexbtn">
            <div
              type="button"
              onClick={goBack}
              class="back-button btn btn-link"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                class="bi bi-chevron-left back-button-img"
              >
                <path
                  fill-rule="evenodd"
                  d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
                ></path>
              </svg>
            </div>
            <h2 className="theme-clr h33 flxbtn nomb"> Your Information</h2>
          </div>{" "}
          <hr className="hr" />
          <div className="flexbtna">
            <label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
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
                value={formData.lastName}
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
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>
          <button type="submit" className=" sub-btn theme-btn">
            Continue
          </button>
          {/* <button type="button" className="secondary">
            Go Back
          </button> */}
        </form>
      )}

      {step === 3 && (
        <form onSubmit={() => setStep(4)}>
          <div className="flexbtn">
            <div
              type="button"
              onClick={goBack}
              class="back-button btn btn-link"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                class="bi bi-chevron-left back-button-img"
              >
                <path
                  fill-rule="evenodd"
                  d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
                ></path>
              </svg>
            </div>
            <h2 className="theme-clr h33 flxbtn nomb">Select Vehicle</h2>
          </div>{" "}
          <hr className="hr" />
          <label>
            <select
              name="vehicle"
              onChange={handleVehicleSelect}
              className="inp-ctrl"
              required
            >
              <option value="">Select a vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.vin} value={vehicle.vin}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className=" sub-btn theme-btn">
            Continue
          </button>
        </form>
      )}

      {step === 4 && (
        <form onSubmit={() => setStep(5)}>
          <div className="flexbtn">
            <div
              type="button"
              onClick={goBack}
              class="back-button btn btn-link"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                class="bi bi-chevron-left back-button-img"
              >
                <path
                  fill-rule="evenodd"
                  d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
                ></path>
              </svg>
            </div>
            <h2 className="theme-clr h33 flxbtn nomb">Select Service</h2>
          </div>{" "}
          <hr className="hr" />
          <label>
            <select
              className="inp-ctrl"
              name="serviceType"
              onChange={handleServiceSelect}
              required
            >
              <option value="">Select a service</option>
              {services.map((service) => (
                <option key={service.opcode} value={service.opcode}>
                  {service.serviceName}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className=" sub-btn theme-btn">
            Continue
          </button>
        </form>
      )}

      {step === 5 && (
        <form onSubmit={() => setStep(6)}>
          {" "}
          <div className="flexbtn">
            <div
              type="button"
              onClick={goBack}
              class="back-button btn btn-link"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                class="bi bi-chevron-left back-button-img"
              >
                <path
                  fill-rule="evenodd"
                  d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
                ></path>
              </svg>
            </div>
            <h2 className="theme-clr h33 flxbtn nomb">Choose Transport Type</h2>
          </div>{" "}
          <hr className="hr" />
          <label>
            <select
              name="transportType"
              onChange={handleTransportSelect}
              className="inp-ctrl"
              required
            >
              <option value="">Select transport type</option>
              <option value="DROPOFF">Drop off</option>
              <option value="WAITER">Wait at dealership</option>
            </select>
          </label>
          <button type="submit" className=" sub-btn theme-btn">
            Continue
          </button>
        </form>
      )}

      {step === 6 && (
        <div className="date-time-container">
          <div className="calendar-container">
            {" "}
            <div className="flexbtn">
              <div
                type="button"
                onClick={goBack}
                class="back-button btn btn-link"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  class="bi bi-chevron-left back-button-img"
                >
                  <path
                    fill-rule="evenodd"
                    d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
                  ></path>
                </svg>
              </div>
              <h2 className="theme-clr h33 flxbtn nomb">Select Date/Time</h2>
            </div>{" "}
            <hr className="hr" />
            <div className="flex-te">
              <label className="lbl1">
                {/* <DatePicker
                selected={
                  formData.appointmentDate
                    ? new Date(formData.appointmentDate)
                    : null
                }
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                minDate={new Date()}
                maxDate={moment().add(6, "days").toDate()}
                required
              /> */}
                <DatePicker
                  selected={
                    formData.appointmentDate
                      ? new Date(formData.appointmentDate)
                      : null
                  }
                  onChange={handleDateChange}
                  dateFormat="yyyy-MM-dd"
                  minDate={new Date()}
                  maxDate={moment().add(6, "days").toDate()}
                  required
                  inline
                />
              </label>
              <div className="time-slots-container">
                <label>
                  <h2 className="per">Time</h2>
                  <select
                    name="appointmentTime"
                    onChange={handleAppointmentSelect}
                    required
                    className="inp-ctrl apttm"
                  >
                    <option value="">Select a time slot</option>
                    {filteredAvailability.map((slot) => (
                      <option
                        key={slot.appointmentDateTimeLocal}
                        value={moment(slot.appointmentDateTimeLocal).format(
                          "HH:mm"
                        )}
                      >
                        {moment(slot.appointmentDateTimeLocal).format("h:mm A")}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>
          {/* <button type="button" onClick={goBack}>
            Go Back
          </button> */}
        </div>
      )}

      {step === 7 && (
        <form onSubmit={handleAppointmentSubmit}>
          <div className="flexbtn">
            <div
              type="button"
              onClick={goBack}
              class="back-button btn btn-link"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                class="bi bi-chevron-left back-button-img"
              >
                <path
                  fill-rule="evenodd"
                  d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
                ></path>
              </svg>
            </div>
            <h2 className="theme-clr h33 flxbtn nomb">Confirm Appointment</h2>
          </div>{" "}
          <hr className="hr" />
          <div>
            <strong>Date:</strong> {formData.appointmentDate}
          </div>
          <div>
            <strong>Time:</strong> {formData.appointmentTime}
          </div>
          <div>
            <strong>Service:</strong>{" "}
            {
              services.find(
                (service) => service.opcode === formData.serviceType
              )?.serviceName
            }
          </div>
          <div>
            <strong>Transport Type:</strong> {formData.transportType}
          </div>
          <div className="comments">
            <label>
              <p className="cmt-er"> Add Comments!</p>
              <textarea
                name="comment"
                className="cmt"
                value={formData.comment}
                onChange={handleChange}
              ></textarea>
            </label>
          </div>
          <button type="submit" className=" sub-btn theme-btn">
            Book Appointment
          </button>
        </form>
      )}

      {step === 8 && customer.appointments && (
        <div>
          <div className="flexbtn">
            <div
              type="button"
              onClick={goBack}
              class="back-button btn btn-link"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                class="bi bi-chevron-left back-button-img"
              ></svg>
            </div>
            <h2 className="theme-clr h33 flxbtn nomb">Existing Appointments</h2>
          </div>{" "}
          <hr className="hr" />
          {customer.appointments.map((appointment) => (
            <div key={appointment.confKey} className="appointment">
              <p>
                <strong>Date:</strong> {appointment.appointmentDateTimeLocal}
                <br />
                <strong>Service:</strong>{" "}
                {appointment.services
                  .map((service) => service.serviceName)
                  .join(", ")}
                <br />
                <strong>Transport Type:</strong>{" "}
                {appointment.transportationType}
              </p>
              <button
                onClick={() => handleCancelAppointment(appointment.confKey)}
              >
                Cancel Appointment
              </button>
            </div>
          ))}
          <button
            type="button"
            className="secondary"
            onClick={() => setStep(3)}
          >
            Book New Appointment
          </button>
        </div>
      )}
    </div>
  );
}
