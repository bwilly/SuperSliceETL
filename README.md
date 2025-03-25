# Salem Super Slice ETL

## Overview
This project extracts, transforms, and loads (ETL) data from Uber Eats, Square, and Slice into a PostgreSQL database (`sss_etl_db`).

---

## 🚀 Setup Instructions

### 1️⃣ Install Dependencies
1. Install [PostgreSQL](https://www.postgresql.org/) via Homebrew:
   ```sh
   brew install postgresql
   ```
2. Install Node.js using `nvm`:
   ```sh
   brew install nvm
   nvm install 18
   ```
3. Clone the repository:
   ```sh
   git clone <repo_url>
   cd sss-etl
   ```

---

### 2️⃣ Configure Environment
1. Create a `.env` file:
   ```sh
   touch .env
   ```
2. Inside `.env`, add:
   ```
   DATABASE_URL=postgres://your_username:your_password@localhost:5432/sss_etl_db
   ```
   *(Replace `your_username` and `your_password` with your actual PostgreSQL credentials.)*

3. Install dependencies:
   ```sh
   npm install
   ```

---

### 3️⃣ Run ETL
Run the ETL process:
```sh
node etl.js
```

---

### 4️⃣ Database Schema
The ETL normalizes orders, transactions, and itemized data across Uber Eats, Square, and Slice into PostgreSQL.

- **`orders`** – Stores high-level order details.
- **`order_items`** – Stores individual items per order.
- **`transactions`** – Stores payments, fees, and refunds.
- **`courier_deliveries`** – Stores delivery data (Uber Eats).

---

### 5️⃣ License
This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.  
This means **any modifications and distributions must remain open-source** under the same GPL terms.

For full license details, see the [GPL License](https://www.gnu.org/licenses/gpl-3.0.txt).

