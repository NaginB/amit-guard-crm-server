import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/admin.model";
import Guard from "../models/guard.model";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);

    await Admin.deleteMany({});

    await Admin.create([
      {
        email: "amit.parekh@eagleeyesecurity.com",
        password: "Admin@2204",
        role: "admin",
      },
      {
        email: "employee@eagleeyesecurity.com",
        password: "Emp@2204",
        role: "employee",
      }
    ]);
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
};

const seedGuards = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);

    // Clear existing guards
    await Guard.deleteMany({});

    let sampleGuards = [
      {
        firstName: "John",
        lastName: "Smith",
        dateOfBirth: new Date("1985-03-15"),
        gender: "Male",
        contactNumber: "+1-555-123-4567",
        alternateContactNumber: "+1-555-123-4568",
        email: "john.smith@guardcrm.com",
        presentAddress: "123 Main St, City, State 12345",
        permanentAddress: "123 Main St, City, State 12345",
        bankName: "First National Bank",
        accountNumber: "1234567890",
        ifscCode: "FNB0001234",
        branchName: "Main Branch",
        salary: 45000,
        aadharNumber: "1234-5678-9012",
        panNumber: "ABCDE1234F",
        fatherName: "William Smith",
        motherName: "Mary Smith",
        emergencyContactName: "Jane Smith",
        emergencyContactNumber: "+1-555-987-6543",
        emergencyContactRelation: "Spouse",
        joiningDate: new Date("2023-01-15"),
        designation: "Guard",
      },
      {
        firstName: "Sarah",
        lastName: "Johnson",
        dateOfBirth: new Date("1982-07-22"),
        gender: "Female",
        contactNumber: "+1-555-234-5678",
        alternateContactNumber: "+1-555-234-5679",
        email: "sarah.johnson@guardcrm.com",
        presentAddress: "456 Oak Ave, City, State 12345",
        permanentAddress: "456 Oak Ave, City, State 12345",
        bankName: "City Bank",
        accountNumber: "0987654321",
        ifscCode: "CB0009876",
        branchName: "Oak Branch",
        salary: 52000,
        aadharNumber: "9876-5432-1098",
        panNumber: "FGHIJ5678K",
        fatherName: "Robert Johnson",
        motherName: "Patricia Johnson",
        emergencyContactName: "Michael Johnson",
        emergencyContactNumber: "+1-555-876-5432",
        emergencyContactRelation: "Spouse",
        joiningDate: new Date("2022-08-20"),
        designation: "Guard",
      },
      {
        firstName: "Mike",
        lastName: "Wilson",
        dateOfBirth: new Date("1990-11-08"),
        gender: "Male",
        contactNumber: "+1-555-345-6789",
        email: "mike.wilson@guardcrm.com",
        presentAddress: "789 Pine Rd, City, State 12345",
        permanentAddress: "789 Pine Rd, City, State 12345",
        bankName: "Regional Bank",
        accountNumber: "1122334455",
        ifscCode: "RB0011223",
        branchName: "Pine Branch",
        salary: 42000,
        aadharNumber: "1122-3344-5566",
        panNumber: "KLMNO9012L",
        fatherName: "Thomas Wilson",
        motherName: "Susan Wilson",
        emergencyContactName: "Lisa Wilson",
        emergencyContactNumber: "+1-555-765-4321",
        emergencyContactRelation: "Spouse",
        joiningDate: new Date("2023-03-10"),
        designation: "Guard",
      },
      {
        firstName: "Emily",
        lastName: "Davis",
        dateOfBirth: new Date("1992-05-12"),
        gender: "Female",
        contactNumber: "+1-555-456-7890",
        email: "emily.davis@guardcrm.com",
        presentAddress: "321 Elm St, City, State 12345",
        permanentAddress: "321 Elm St, City, State 12345",
        bankName: "Metro Bank",
        accountNumber: "5566778899",
        ifscCode: "MB0055667",
        branchName: "Elm Branch",
        salary: 40000,
        aadharNumber: "5566-7788-9900",
        panNumber: "PQRST3456M",
        fatherName: "David Davis",
        motherName: "Jennifer Davis",
        emergencyContactName: "Robert Davis",
        emergencyContactNumber: "+1-555-654-3210",
        emergencyContactRelation: "Brother",
        joiningDate: new Date("2023-06-05"),
        designation: "Guard",
      },
      {
        firstName: "David",
        lastName: "Brown",
        dateOfBirth: new Date("1988-09-30"),
        gender: "Male",
        contactNumber: "+1-555-567-8901",
        email: "david.brown@guardcrm.com",
        presentAddress: "654 Maple Dr, City, State 12345",
        permanentAddress: "654 Maple Dr, City, State 12345",
        bankName: "Community Bank",
        accountNumber: "9988776655",
        ifscCode: "CB0099887",
        branchName: "Maple Branch",
        salary: 38000,
        aadharNumber: "9988-7766-5544",
        panNumber: "UVWXY7890N",
        fatherName: "James Brown",
        motherName: "Linda Brown",
        emergencyContactName: "Sarah Brown",
        emergencyContactNumber: "+1-555-543-2109",
        emergencyContactRelation: "Sister",
        joiningDate: new Date("2022-11-12"),
        designation: "Guard",
      },
    ];

    sampleGuards = sampleGuards.map((guard, i) => ({
      ...guard,
      guardId: i + 1
    }))

    await Guard.insertMany(sampleGuards);
  } catch (error) {
    console.error("Error seeding guards:", error);
  }
};

const seedAll = async () => {
  try {
    await seedAdmin();
    //  await seedGuards();
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    mongoose.disconnect();
  }
};

seedAll();
