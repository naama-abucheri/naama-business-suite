# 🧾 Naama – Smart Inventory & Sales Management System

## 🚀 Overview

**Naama** is a modern, scalable inventory and sales management web application designed to help businesses efficiently manage products, track stock, handle clients, and monitor financial performance.

Built with a clean, premium interface and role-based access control, Naama is designed to evolve into a full SaaS product that can serve multiple businesses.

---

## ✨ Features

### 🔐 Authentication & User Roles

* Secure user authentication
* Role-based access:

  * **Employer (Admin)** – Full system control
  * **Employee (Staff)** – Limited access

---

### 👑 Employer (Admin) Capabilities

* Add, edit, and delete products
* Manage client records
* Record sales and generate receipts
* View financial data (revenue & profit)
* Access calendar-based sales tracking
* Monitor stock levels and alerts

---

### 👩‍💼 Employee Capabilities

* Add new incoming stock
* Add client details
* View inventory (read-only)

🚫 Employees cannot:

* Edit or delete products
* Record sales
* Access receipts or financial data

---

## 📦 Inventory Management

* Track products with:

  * Name
  * Category
  * Buying price
  * Selling price
  * Stock quantity
* Automatic stock updates after sales
* Low stock alerts

---

## 👥 Client Management

* Store and manage customer details:

  * Name
  * Phone number
  * Email (optional)
* Linked to sales and receipts

---

## 💰 Sales & Receipts

* Record product sales
* Automatically generate receipts
* Track:

  * Total revenue
  * Profit per sale
* View and filter receipts

---

## 📅 Calendar View

* View sales and receipts by date
* Track daily performance
* Analyze sales patterns

---

## 📊 Dashboard

* Total products
* Total revenue
* Total profit
* Low stock alerts
* Recent activity overview

---

## 🎨 UI & Design

Naama features a **luxury dark UI** with a maroon theme:

* Primary: `#5A0F1C`
* Secondary: `#3A0A12`
* Accent: `#A44A5A`
* Background: `#0B0B0B`
* Text: `#F5F5F5`

Design focus:

* Minimal
* Elegant
* Responsive (mobile + desktop)

---

## 🧰 Tech Stack

* **Frontend:** React (Vite)
* **Styling:** Tailwind CSS
* **Backend:** Supabase
* **Database:** PostgreSQL
* **Authentication:** Supabase Auth

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone (https://github.com/naama-abucheri/naama-business-suite.git)
cd naama-inventory-suite
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```

---

### 4. Run the Application

```bash
npm run dev
```

---

### 5. Open in Browser

```
http://localhost:5173
```

---

## 🗄️ Database Structure

### Products

* id
* name
* category
* buying_price
* selling_price
* stock_quantity
* created_at
* added_by

### Clients

* id
* client_name
* phone_number
* email
* created_at
* added_by

### Sales / Receipts

* id
* product_id
* client_id
* quantity_sold
* total_amount
* profit
* date
* time

### Profiles (User Roles)

* id
* role (employer / employee)

---

## 🔐 Security

* Role-based access control
* Supabase Row Level Security (RLS)
* Protected routes based on user roles

---

## 🌍 Scalability

Naama is built with scalability in mind:

* Not limited to a single business
* Designed for multi-business (SaaS) expansion
* Modular and extendable architecture

---

## 🚧 Future Improvements

* Multi-tenant support (multiple businesses)
* Subscription billing system
* Advanced analytics dashboard
* Notifications system
* Export receipts (PDF)
* Mobile app version

---

## 📌 Project Status

🚀 In active development
💡 Designed as a future SaaS product

---

## 📄 License

This project is licensed under the MIT License.

---

## 💭 Vision

Naama is more than an inventory app — it is a smart business tool built to help entrepreneurs manage operations, increase efficiency, and scale confidently.
