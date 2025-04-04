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



i want one table for transactions (that is mostly orders. some might be charges for service from the platform to superslice (us).) And the other table will be items, i call it itemized. where items will have a relationship to orders in the transaction table. i thikn all platforms should be etl into one of these two tables. slice doesn't have an itemized view yet. i'll have to write a crawler for that later. each transfomer that i write should be specific to the source csv file. for now, let's focus on creating the table schema. any more questions?

---

Overview, Apr2'25

node main_pipeline.js

FolderScanner finds files. A module that reads the immediate files from a folder and filters by a regex.

FileMarshal drives the processing and deprovisioning. A module that processes each file (using a parser from the ParserFactory), logs results (via Winston), and then moves the file to an archive (or failed) folder (unless in dry‐run mode).

ParserFactory returns the appropriate parser. A factory that returns the appropriate platform‐specific CSV-to-Postgres parser (each parser implements a standard interface).

Each platform-specific parser (like our Uber parser) reads the CSV, validates headers, and inserts rows into its source table.

Optionally, each parser (or the transformer integrated within) also transforms data and inserts rows into the unified table.

The main_pipeline.js script ties everything together, loading config from YAML and logging via Winston (set to debug). That loads a YAML configuration, sets up Winston logging (with debug level), creates a database connection, and then invokes the above modules.