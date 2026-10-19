// Seed file for Interactive Core CS Course Academy (Lessons & Assignments)

export const coursesData = [
  {
    id: 'course-os',
    subject: 'OS',
    title: 'Operating Systems Engineering',
    description: 'Master kernel vs user mode, processes & threads, CPU scheduling, synchronization, deadlocks, paging, and virtual memory from first principles.',
    icon: 'Cpu',
    color: '#00F0FF',
    display_order: 1,
    modules: [
      {
        id: 'mod-os-1',
        title: 'Module 1: Kernel Architecture & Dual-Mode Execution',
        description: 'Understand how CPUs protect hardware via User vs Kernel space, system calls, and traps.',
        module_number: 1,
        display_order: 1,
        lessons: [
          {
            id: 'les-os-101',
            title: 'User Mode vs Kernel Mode: How the CPU Protects Memory',
            slug: 'user-vs-kernel-mode',
            reading_time_minutes: 8,
            analogy_markdown: `Imagine a high-security bank. Customers (User Mode programs like your browser or Spotify) sit in the lobby. They are **never** allowed to walk into the bank vault (Hardware: RAM, Disk, Network Card). 

If a customer needs cash from the vault, they must walk up to a bank teller window (**System Call**) and hand over an official deposit slip. The armed teller (**Kernel Mode**) steps into the vault, safely executes the operation, and returns the result to the customer in the lobby.`,
            content_markdown: `### 1. Why Do We Need Dual-Mode Execution?
Without hardware protection, any buggy or malicious C++ program could write directly to memory address \`0x0000\` and corrupt the operating system, crash other running programs, or read your private passwords directly from physical RAM.

To prevent this chaos, modern CPUs (like Intel x86 and ARM) provide hardware privilege rings:
- **Ring 3 (User Mode)**: Where all user applications (browsers, games, Python scripts) run. In User Mode, the CPU **forbids** executing privileged instructions (such as disabling interrupts, modifying page table registers, or accessing physical I/O ports directly).
- **Ring 0 (Kernel Mode / Supervisor Mode)**: Where the core OS kernel runs with unrestricted access to all CPU instructions, registers, and physical hardware.

### 2. How Does a Program Transition from User to Kernel Mode?
A user program cannot simply "flip" the CPU bit to Kernel Mode. Instead, transitions happen through **controlled hardware gates**:
1. **System Call (\`syscall\` / \`sysenter\` in x86-64)**: Software voluntarily requests an OS service (e.g., \`read()\`, \`write()\`, \`fork()\`).
2. **Hardware Interrupt**: External hardware signals the CPU (e.g., Network card received a packet, timer interrupt ticked).
3. **Hardware Exception / Trap**: CPU detects an illegal instruction or fault (e.g., Divide by zero, Page Fault, illegal memory access).

### 3. Step-by-Step System Call Execution Flow
When you call \`printf("Hello World");\` in C:
1. The standard C library (\`glibc\`) sets up the system call arguments in CPU registers (e.g., \`%rax = 1\` for \`sys_write\`, \`%rdi = 1\` for \`stdout\`).
2. \`glibc\` executes the hardware assembly instruction \`syscall\`.
3. The CPU hardware **switches the privilege level from Ring 3 to Ring 0**, changes the Stack Pointer to the Kernel Stack, and jumps to the kernel's **Interrupt Descriptor Table (IDT)** system call handler.
4. The kernel validates the pointer arguments (preventing buffer overflow exploits).
5. The kernel sends the bytes to the display driver/terminal.
6. The kernel executes \`sysret\`, dropping privilege back to User Mode (Ring 3), and resumes your user program!`,
            diagram_ascii: `+-------------------------------------------------------------+
| USER MODE (Ring 3) - Restricted Privileges                  |
|   [ Your App: printf() ] ---> [ glibc wrapper: syscall ]    |
+------------------------------------|------------------------+
                                     | (Hardware Trap / syscall)
                                     v (CPU flips privilege bit)
+-------------------------------------------------------------+
| KERNEL MODE (Ring 0) - Full Hardware Control                |
|   [ Syscall Dispatcher ] ---> [ sys_write() ] ---> [ Disk ]  |
+-------------------------------------------------------------+`,
            code_snippet: `// Inspecting a raw assembly syscall in x86-64 Linux
#include <unistd.h>

int main() {
    // Direct Linux syscall 1 (sys_write):
    // write(int fd, const void *buf, size_t count)
    const char msg[] = "Direct Syscall to Kernel!\\n";
    
    // In assembly, syscall number goes into RAX, args into RDI, RSI, RDX:
    __asm__ volatile (
        "mov $1, %%rax\\n"     // Syscall #1 is sys_write
        "mov $1, %%rdi\\n"     // File descriptor 1 = stdout
        "mov %0, %%rsi\\n"     // Buffer address
        "mov $26, %%rdx\\n"    // Number of bytes
        "syscall\\n"          // Trap into Kernel Mode
        :
        : "r"(msg)
        : "%rax", "%rdi", "%rsi", "%rdx"
    );
    return 0;
}`,
            code_language: 'cpp',
            key_takeaways: JSON.stringify([
              'User Mode (Ring 3) protects hardware; Kernel Mode (Ring 0) has unrestricted physical access.',
              'Transitions only occur via controlled gates: System Calls (software), Interrupts (hardware), or Exceptions/Traps.',
              'The CPU hardware enforces privilege checks on every memory and instruction fetch.'
            ]),
            display_order: 1,
            assignments: [
              {
                id: 'asgn-os-101-1',
                question: 'What happens if a User Mode program attempts to execute a privileged CPU instruction, such as writing directly to the page table root register (CR3)?',
                options_json: JSON.stringify([
                  'The CPU executes the instruction normally but logs a warning.',
                  'The CPU hardware immediately halts the instruction and fires a General Protection Fault (Trap), allowing the OS kernel to terminate the program.',
                  'The program temporarily elevates itself into Kernel Mode for that single instruction.',
                  'The instruction is redirected to the L1 CPU cache.'
                ]),
                correct_option_idx: 1,
                explanation_markdown: 'CPUs have hardware-level privilege enforcement. If Ring 3 tries to execute a Ring 0 instruction, the CPU triggers a General Protection Fault (GPF) exception, which vectors into the kernel interrupt handler, typically terminating the process with a Segmentation Fault.',
                display_order: 1
              },
              {
                id: 'asgn-os-101-2',
                question: 'Why does a standard printf() call incur a context transition into Kernel Mode?',
                options_json: JSON.stringify([
                  'Formatting strings requires kernel permissions.',
                  'Displaying characters requires interacting with hardware I/O (display driver / terminal), which is strictly forbidden in User Mode.',
                  'printf() always runs as a separate background process.',
                  'The C standard library cannot allocate heap memory without kernel mode.'
                ]),
                correct_option_idx: 1,
                explanation_markdown: 'Hardware I/O devices (screens, disks, network cards) are protected physical resources. Any write to an output stream (like stdout) must invoke the sys_write system call so the kernel can safely transmit the data to the driver.',
                display_order: 2
              },
              {
                id: 'asgn-os-101-3',
                question: 'Which of the following describes an asynchronous event generated by external hardware rather than the CPU executing software code?',
                options_json: JSON.stringify([
                  'System Call (syscall)',
                  'Divide by zero Exception',
                  'Hardware Interrupt (e.g. Network card packet arrival or Timer tick)',
                  'Page Fault Trap'
                ]),
                correct_option_idx: 2,
                explanation_markdown: 'Hardware interrupts are asynchronous electrical signals sent by external peripherals (NIC, keyboard, timer chip). In contrast, syscalls, divide-by-zero, and page faults are synchronous traps generated by the CPU executing current instructions.',
                display_order: 3
              }
            ]
          }
        ]
      },
      {
        id: 'mod-os-2',
        title: 'Module 2: Process & Thread Architecture',
        description: 'Understand process memory layout, lightweight threads, and the cost of context switching.',
        module_number: 2,
        display_order: 2,
        lessons: [
          {
            id: 'les-os-201',
            title: 'Process Memory Layout: Stack, Heap, Data & Text Segments',
            slug: 'process-memory-layout',
            reading_time_minutes: 9,
            analogy_markdown: `Think of a process memory layout like a multi-story workshop:
- **Text / Code (Ground Floor)**: The blueprints fixed in cement. Read-only so workers cannot accidentally rewrite instructions.
- **Data & BSS (Storage Room)**: Permanent inventory shelves for global supplies.
- **Heap (Flexible Warehouse Floor)**: Expands upwards on-demand when you rent extra crates (\`malloc\`).
- **Stack (Top Floor Elevator)**: Grows downwards. Every time a worker starts a task (\`function\`), they place a new clipboard on top. When the task finishes, they pop it off!`,
            content_markdown: `### 1. The Anatomy of a Process in Virtual Memory
When an executable program is launched into RAM, the OS and CPU create an isolated **Virtual Address Space** divided into 4 primary regions:

1. **Text Segment (Code)**:
   - Contains compiled CPU machine instructions.
   - **Read-Only**: Attempting to write here triggers \`SIGSEGV\`.
   - **Sharable**: Multiple instances of the same program (e.g. 5 bash terminals) share the exact same physical text pages in RAM.
2. **Data & BSS Segments**:
   - **Initialized Data Segment**: Global and \`static\` variables that have initial values (e.g. \`int port = 8080;\`).
   - **BSS (Block Started by Symbol)**: Global and \`static\` variables that are uninitialized or initialized to zero. The OS zeroes this memory automatically.
3. **Heap (Dynamic Allocation)**:
   - Managed at runtime via \`malloc()\` / \`free()\` in C, or \`new\` / garbage collection in modern languages.
   - Grows **upward** toward higher memory addresses via system calls like \`brk()\` and \`mmap()\`.
4. **Stack (Call Stack & Local Variables)**:
   - Stores function parameters, local variables, and return addresses.
   - Grows **downward** toward lower memory addresses.
   - Every function call pushes a **Stack Frame**; returning pops that frame in $O(1)$ time.

### 2. Stack Overflow vs Heap Exhaustion
- If recursive calls never terminate, the stack grows downwards until it smashes into the guard page, causing a **Stack Overflow**.
- If dynamic allocations exceed available virtual memory or RAM+swap, \`malloc()\` returns \`NULL\` or the OS Out-Of-Memory (OOM) killer terminates the process.`,
            diagram_ascii: `High Memory (0x7FFFFFFFFFFF)
+---------------------------------------+
| Environment Variables & CLI Arguments |
+---------------------------------------+
| Stack (Local vars, grows DOWNWARD)    |
|   |                                   |
|   v                                   |
|               [ Guard Page ]          |
|   ^                                   |
|   |                                   |
| Heap (Dynamic malloc, grows UPWARD)   |
+---------------------------------------+
| BSS Segment (Uninitialized globals)   |
+---------------------------------------+
| Data Segment (Initialized globals)    |
+---------------------------------------+
| Text Segment (Compiled Code - R/O)    |
+---------------------------------------+
Low Memory (0x000000000000)`,
            code_snippet: `// Demonstrating where variables live in process memory:
#include <stdio.h>
#include <stdlib.h>

int global_initialized = 42;    // Data Segment
int global_uninitialized;      // BSS Segment

void check_memory(int arg) {
    int local_var = 10;        // Stack Frame
    int* heap_ptr = (int*)malloc(sizeof(int)); // Heap

    printf("Code (Text):   %p\\n", check_memory);
    printf("Global Data:   %p\\n", &global_initialized);
    printf("Global BSS:    %p\\n", &global_uninitialized);
    printf("Heap Pointer:  %p\\n", heap_ptr);
    printf("Stack Local:   %p\\n", &local_var);

    free(heap_ptr);
}

int main() {
    check_memory(1);
    return 0;
}`,
            code_language: 'cpp',
            key_takeaways: JSON.stringify([
              'Text segment holds read-only executable machine code.',
              'Stack grows downward with function calls and local variables; Heap grows upward with dynamic allocation.',
              'Every process has its own isolated virtual address space, isolating it from other processes.'
            ]),
            display_order: 1,
            assignments: [
              {
                id: 'asgn-os-201-1',
                question: 'Which process memory segment stores local variables declared inside a function?',
                options_json: JSON.stringify([
                  'Text / Code Segment',
                  'Stack Segment',
                  'BSS Segment',
                  'Heap Segment'
                ]),
                correct_option_idx: 1,
                explanation_markdown: 'Local variables and function parameters are allocated automatically on the Stack within the active Stack Frame when a function is entered, and deallocated when the function returns.',
                display_order: 1
              },
              {
                id: 'asgn-os-201-2',
                question: 'Why is the Text (Code) segment marked as Read-Only by the OS?',
                options_json: JSON.stringify([
                  'To prevent programs from accidentally or maliciously modifying their own instructions at runtime.',
                  'Because RAM hardware does not support writing to code.',
                  'To make the program execute faster on the CPU.',
                  'Because compilers do not know the memory addresses in advance.'
                ]),
                correct_option_idx: 0,
                explanation_markdown: 'Marking the Text segment read-only prevents self-modifying code vulnerabilities (like buffer-overflow code injection) and allows the OS to safely share a single copy of executable code in physical RAM across multiple running instances.',
                display_order: 2
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'course-dbms',
    subject: 'DBMS',
    title: 'Database Systems & SQL Internals',
    description: 'Learn relational algebra, advanced SQL, ACID guarantees, transaction isolation levels, WAL crash recovery, and B+ Tree indexing.',
    icon: 'Database',
    color: '#10B981',
    display_order: 2,
    modules: [
      {
        id: 'mod-dbms-1',
        title: 'Module 1: Transactions, ACID & Crash Recovery',
        description: 'Understand how databases guarantee data integrity and durability despite sudden power failures.',
        module_number: 1,
        display_order: 1,
        lessons: [
          {
            id: 'les-dbms-101',
            title: 'Demystifying ACID: How Databases Prevent Chaos',
            slug: 'acid-properties-explained',
            reading_time_minutes: 8,
            analogy_markdown: `Think of a bank transfer: Transferring $100 from Alice to Bob requires two steps:
1. Deduct $100 from Alice.
2. Add $100 to Bob.

If a lightning bolt hits the server right between step 1 and step 2, Alice loses $100 and Bob gets nothing! **Atomicity** ensures the database is treated as an indivisible atom: either **both** steps happen, or **neither** happens.`,
            content_markdown: `### 1. The 4 ACID Guarantees Explained
Relational databases are built on 4 foundational pillars:

1. **Atomicity (All or Nothing)**:
   - A transaction may contain 10 SQL statements. If statement #9 fails or the database crashes, all previous 8 statements are rolled back cleanly.
   - Enforced by the **Undo Log** and **Write-Ahead Logging (WAL)**.
2. **Consistency (Preserving Invariants)**:
   - The database moves from one valid state to another valid state.
   - All schema rules, unique keys, check constraints (e.g. \`balance >= 0\`), and foreign key cascades are strictly satisfied.
3. **Isolation (Concurrent Independence)**:
   - Even if 1,000 users are transferring money simultaneously, each transaction executes as if it were the sole transaction on the database.
   - Enforced by locks (2PL) and Multi-Version Concurrency Control (MVCC).
4. **Durability (Surviving Crashes)**:
   - Once a transaction receives a successful \`COMMIT\` response, its changes are **permanently etched into non-volatile storage**.
   - If the power cord is pulled 1 microsecond after commit, the data will still be intact upon reboot!

### 2. How Durability is Physically Implemented: WAL
Why can't the database just write the updated table data to disk immediately on \`COMMIT\`?
- Table rows are scattered across random 16KB disk pages. Writing randomly on disk is orders of magnitude slower than sequential I/O.
- Instead, the database appends a sequential change record to the **Write-Ahead Log (WAL)** file on disk and executes a synchronous \`fsync()\`.
- During crash reboot, the **ARIES recovery algorithm** replays the WAL log to restore any committed changes that had not yet reached the data files!`,
            diagram_ascii: `[ Client: COMMIT ]
        |
        v
[ 1. Append Log Record to WAL (Sequential Write) ] ---> (fsync to SSD/Disk)
        |
        v
[ 2. Respond 'Success' to Client ] (Ultra Fast & Durable!)
        |
        ... (Later, in background) ...
        v
[ 3. Buffer Pool writes random 16KB dirty page to Data File ]`,
            code_snippet: `-- Demonstrating an Atomic Transaction in SQL:
BEGIN TRANSACTION;

-- Step 1: Debit sender
UPDATE accounts 
SET balance = balance - 100 
WHERE user_id = 'alice' AND balance >= 100;

-- Step 2: Credit receiver
UPDATE accounts 
SET balance = balance + 100 
WHERE user_id = 'bob';

-- If both succeeded, make changes permanent:
COMMIT;

-- If an error occurred:
-- ROLLBACK;`,
            code_language: 'sql',
            key_takeaways: JSON.stringify([
              'Atomicity guarantees all-or-nothing execution via rollback logs.',
              'Durability guarantees committed data survives crashes via sequential Write-Ahead Logging (WAL).',
              'Isolation protects concurrent transactions from corrupting shared rows.'
            ]),
            display_order: 1,
            assignments: [
              {
                id: 'asgn-dbms-101-1',
                question: 'Which ACID property guarantees that a committed transaction will never be lost, even if the database server loses power a moment later?',
                options_json: JSON.stringify([
                  'Atomicity',
                  'Consistency',
                  'Isolation',
                  'Durability'
                ]),
                correct_option_idx: 3,
                explanation_markdown: 'Durability guarantees that once a transaction commits, its modifications are persisted to durable storage (via WAL fsync) and will survive power failures, system crashes, and reboots.',
                display_order: 1
              },
              {
                id: 'asgn-dbms-101-2',
                question: 'Why do databases write to a Write-Ahead Log (WAL) before writing to the actual table data files?',
                options_json: JSON.stringify([
                  'WAL writes are sequential and fast, whereas updating table files requires slow random disk I/O.',
                  'WAL files are automatically stored in the cloud.',
                  'Table files cannot store binary data.',
                  'WAL eliminates the need for SQL syntax validation.'
                ]),
                correct_option_idx: 0,
                explanation_markdown: 'Sequential writes to a log file are orders of magnitude faster than random writes across multi-gigabyte table files. The WAL ensures durability quickly with fsync, allowing dirty pages in the buffer pool to be written to disk asynchronously in the background.',
                display_order: 2
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'course-cn',
    subject: 'CN',
    title: 'Computer Networks & Web Protocols',
    description: 'Learn the OSI and TCP/IP stack, packet routing, TCP 3-way handshakes, congestion control, and the evolution from HTTP/1 to HTTP/3 (QUIC).',
    icon: 'Globe',
    color: '#38BDF8',
    display_order: 3,
    modules: [
      {
        id: 'mod-cn-1',
        title: 'Module 1: The Transport Layer & TCP Mechanics',
        description: 'Dive deep into connection handshakes, teardowns, and reliable data delivery.',
        module_number: 1,
        display_order: 1,
        lessons: [
          {
            id: 'les-cn-101',
            title: 'The TCP 3-Way Handshake & Why 2 Packets Aren\'t Enough',
            slug: 'tcp-three-way-handshake',
            reading_time_minutes: 8,
            analogy_markdown: `Imagine two people communicating via walkie-talkie with static:
1. Alice: *"Bob, can you hear me? (SYN)"*
2. Bob: *"Yes Alice, I hear you! Can you hear me? (SYN-ACK)"*
3. Alice: *"Yes Bob, I hear you loud and clear! (ACK)"*

Without Alice's final confirmation (3rd packet), Bob would never know if Alice received his voice, and couldn't be sure the line is open!`,
            content_markdown: `### 1. What is TCP?
TCP (Transmission Control Protocol) is a **connection-oriented, reliable, in-order byte stream** transport protocol. 
Before any application data (like an HTTP request or JSON payload) can be sent, the client and server must establish a connection via the **3-Way Handshake**.

### 2. The 3 Steps of the Handshake
1. **SYN (Synchronize)**:
   - Client generates a random **Initial Sequence Number (ISN)** $x$.
   - Sends a TCP packet with the \`SYN\` flag set: \`SYN, Seq = x\`.
   - Client enters \`SYN_SENT\` state.
2. **SYN-ACK (Synchronize-Acknowledge)**:
   - Server receives the SYN, generates its own random ISN $y$.
   - Acknowledges client's sequence by sending $Ack = x + 1$.
   - Sends packet with flags: \`SYN, ACK, Seq = y, Ack = x + 1\`.
   - Server enters \`SYN_RCVD\` state.
3. **ACK (Acknowledge)**:
   - Client receives SYN-ACK.
   - Sends final confirmation: \`ACK, Seq = x + 1, Ack = y + 1\`.
   - Both client and server enter \`ESTABLISHED\` state and can begin transmitting data!

### 3. Why Can't We Use a 2-Way Handshake?
Suppose we only used 2 packets (SYN and SYN-ACK):
- Imagine an old, delayed SYN packet from an aborted session arrives at the server 5 minutes later.
- The server receives it, assumes a new client wants to connect, allocates memory and sockets, and sends SYN-ACK.
- Since it was an old phantom packet, the client ignores the SYN-ACK. But the server would believe the connection is open, leading to memory leaks and resource exhaustion!
- The 3rd ACK packet guarantees that **both sides have verified each other is alive and agreed upon starting sequence numbers**.`,
            diagram_ascii: `Client (Browser)                               Server (Backend)
     |                                               |
     | ---------- 1. [SYN, Seq=x] -----------------> | (Server in SYN_RCVD)
     |                                               |
     | <--------- 2. [SYN-ACK, Seq=y, Ack=x+1] ----- | (Client in ESTABLISHED)
     |                                               |
     | ---------- 3. [ACK, Seq=x+1, Ack=y+1] ------> | (Server in ESTABLISHED)
     |                                               |
     | ================= Connection Open =========== |`,
            code_snippet: `// Inspecting TCP socket connection in Node.js
import net from 'net';

const client = net.createConnection({ port: 80, host: 'google.com' }, () => {
  // Triggers OS to perform TCP 3-way handshake under the hood!
  console.log('TCP 3-Way Handshake Complete! Connected to Google.');
  
  // Now we can send application HTTP byte stream:
  client.write('GET / HTTP/1.1\\r\\nHost: google.com\\r\\n\\r\\n');
});

client.on('data', (data) => {
  console.log('Received data packet:', data.toString());
  client.end(); // Triggers TCP 4-way teardown
});`,
            code_language: 'javascript',
            key_takeaways: JSON.stringify([
              'TCP 3-way handshake synchronizes initial sequence numbers (ISNs) between client and server.',
              'Guarantees full-duplex communication readiness before data transmission.',
              'Prevents old, delayed duplicate packets from opening zombie connections on the server.'
            ]),
            display_order: 1,
            assignments: [
              {
                id: 'asgn-cn-101-1',
                question: 'What is the primary role of the 3rd packet (ACK) in the TCP 3-way handshake?',
                options_json: JSON.stringify([
                  'To encrypt the payload using TLS.',
                  'To confirm to the server that the client received the server\'s SYN-ACK and agreed on sequence numbers.',
                  'To determine the client\'s IP address.',
                  'To test if the firewall is blocking UDP traffic.'
                ]),
                correct_option_idx: 1,
                explanation_markdown: 'The 3rd ACK packet lets the server know that the client successfully received its SYN-ACK response, confirming both directions of the full-duplex connection are operational.',
                display_order: 1
              },
              {
                id: 'asgn-cn-101-2',
                question: 'If a client sends SYN with Seq=500, what will the server\'s acknowledgment number (Ack) be in the SYN-ACK response?',
                options_json: JSON.stringify([
                  '500',
                  '501',
                  '0',
                  '1000'
                ]),
                correct_option_idx: 1,
                explanation_markdown: 'TCP acknowledgments signify the next expected byte sequence number. Since SYN consumes 1 logical sequence number, the server responds with Ack = 500 + 1 = 501.',
                display_order: 2
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'course-system-design',
    subject: 'System Design',
    title: 'Distributed System Design & Architecture',
    description: 'Learn horizontal scaling, caching strategies, load balancers, database sharding, CAP theorem, and rate limiters.',
    icon: 'Layers',
    color: '#B8FF3C',
    display_order: 4,
    modules: [
      {
        id: 'mod-sd-1',
        title: 'Module 1: Scalability & Load Balancing',
        description: 'Scale systems from 1 user to millions of concurrent requests.',
        module_number: 1,
        display_order: 1,
        lessons: [
          {
            id: 'les-sd-101',
            title: 'Vertical vs Horizontal Scaling & The Stateless Tier',
            slug: 'vertical-vs-horizontal-scaling',
            reading_time_minutes: 8,
            analogy_markdown: `Imagine you run a pizza delivery business:
- **Vertical Scaling (Scale Up)**: You buy a faster, supercharged Ferrari for your delivery driver. But eventually, no matter how much money you spend, a single car can only drive so fast and carries a hard physical limit.
- **Horizontal Scaling (Scale Out)**: You hire 20 delivery drivers with regular scooters. If orders double, you simply hire 20 more!`,
            content_markdown: `### 1. Vertical Scaling (Scale Up)
- **Concept**: Add more CPU, RAM, or faster NVMe SSDs to your existing single server.
- **Pros**: Simple; zero code changes needed; no network partitioning issues.
- **Cons**: 
  - **Hard Hardware Ceiling**: There is a limit to how many cores and RAM you can stick into one motherboard.
  - **Single Point of Failure (SPOF)**: If that server dies, your entire business is offline.
  - **Exponential Cost Curve**: High-end enterprise servers cost astronomically more than commodity machines.

### 2. Horizontal Scaling (Scale Out)
- **Concept**: Add more commodity servers to your pool and distribute traffic using a **Load Balancer**.
- **Pros**: Virtually unlimited scalability; high availability (if 2 servers crash, 8 others handle the load).
- **The Golden Rule**: Your application tier **MUST BE STATELESS**!

### 3. What Does "Stateless Architecture" Mean?
- In a stateful architecture, user session data (like login status or shopping cart items) is stored in the memory of Server A. If the user's next request is routed to Server B, they are suddenly logged out!
- In a **stateless architecture**, servers do not store client state in local memory. All persistent state is externalized to a shared, scalable store (like Redis, a Database, or encrypted JWT tokens).
- Any server can handle any request at any time!`,
            diagram_ascii: `                 [ Clients / Browsers ]
                           |
                           v
                 [ Load Balancer (Nginx) ]
                /          |           \\
               v           v            v
        [ App Server 1 ] [ App Server 2 ] [ App Server 3 ] (Stateless!)
               \\           |            /
                v          v           v
           +--------------------------------+
           | Shared Redis Session / DB Tier | (Stateful)
           +--------------------------------+`,
            code_snippet: `// Express.js Stateless Architecture using JWT:
import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();

// Stateless auth: User state is encoded inside the token,
// NOT stored in local server RAM memory!
app.get('/api/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const userPayload = jwt.verify(token, process.env.JWT_SECRET);
    // Any backend server instance can verify this signature without querying a local session map!
    res.json({ success: true, user: userPayload });
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});`,
            code_language: 'javascript',
            key_takeaways: JSON.stringify([
              'Vertical scaling has hard hardware limits and represents a single point of failure.',
              'Horizontal scaling enables elastic scaling by adding commodity instances behind a load balancer.',
              'Application servers must be stateless; user session state must be externalized to Redis or JWTs.'
            ]),
            display_order: 1,
            assignments: [
              {
                id: 'asgn-sd-101-1',
                question: 'Why must web application servers be stateless to scale horizontally effectively?',
                options_json: JSON.stringify([
                  'Stateless servers do not require an operating system.',
                  'Any server can handle any user request without needing prior session data stored in local memory.',
                  'Stateless servers consume zero CPU power.',
                  'Databases do not support stateful connections.'
                ]),
                correct_option_idx: 1,
                explanation_markdown: 'If servers are stateless, the load balancer can distribute incoming traffic freely across any instance. If a server crashes, other servers immediately take over with zero disruption to active user sessions.',
                display_order: 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'course-oops',
    subject: 'OOPs',
    title: 'Object-Oriented Programming & Low-Level Design',
    description: 'Master Encapsulation, Polymorphism, SOLID principles, and GoF design patterns with clean C++ and Java code.',
    icon: 'Code2',
    color: '#C084FC',
    display_order: 5,
    modules: [
      {
        id: 'mod-oops-1',
        title: 'Module 1: The 4 Pillars of OOP',
        description: 'Understand encapsulation, abstraction, inheritance, and dynamic polymorphism.',
        module_number: 1,
        display_order: 1,
        lessons: [
          {
            id: 'les-oops-101',
            title: 'The 4 Pillars of OOP: From Concept to Clean Code',
            slug: 'four-pillars-of-oops',
            reading_time_minutes: 9,
            analogy_markdown: `Think of driving a modern car:
- **Abstraction**: You press the gas pedal to accelerate. You do not need to know the engine combustion ratio or valve timing under the hood.
- **Encapsulation**: The fuel tank and spark plugs are sealed inside the engine bay so passengers cannot accidentally pour coffee onto the alternator.
- **Inheritance**: A \`TeslaModel3\` inherits core attributes of \`ElectricCar\`, which in turn inherits from \`Vehicle\`.
- **Polymorphism**: Pressing the brake pedal in a gas car activates hydraulic brake pads; in a Tesla it activates regenerative braking. Same command, different behavior!`,
            content_markdown: `### 1. Encapsulation (Data Hiding & Protection)
- **Principle**: Bundle data (fields) and the methods that operate on that data into a single unit (class), while restricting direct access to internal state using access specifiers (\`private\`, \`protected\`, \`public\`).
- **Why**: Protects object invariants. For example, a \`BankAccount\` class ensures balance cannot be set to negative without going through validation.

### 2. Abstraction (Hiding Complexity)
- **Principle**: Expose only the necessary, high-level interface while hiding internal implementation mechanics.
- **Mechanism**: Implemented via **Abstract Classes** and **Interfaces**.

### 3. Inheritance (Code Reuse & Hierarchy)
- **Principle**: Allows a derived class to inherit fields and behaviors from a base class (**IS-A** relationship).
- **Best Practice Tip**: Prefer **Composition over Inheritance** (**HAS-A** over **IS-A**) to avoid brittle, tightly coupled inheritance trees!

### 4. Polymorphism (Many Forms)
- **Compile-Time Polymorphism (Static Binding)**:
  - **Function / Method Overloading**: Same function name with different parameter types or counts.
  - Resolved at compile time.
- **Runtime Polymorphism (Dynamic Binding)**:
  - **Method Overriding**: Derived class provides a specific implementation of a virtual method declared in base class.
  - Resolved at runtime using the **vtable (Virtual Table)** and **vptr (Virtual Pointer)**!`,
            code_snippet: `// C++ Demonstrating the 4 Pillars
#include <iostream>
#include <string>

// 1. Abstraction (Abstract Interface)
class PaymentGateway {
public:
    virtual void processPayment(double amount) = 0; // Pure virtual
    virtual ~PaymentGateway() {}
};

// 2. Encapsulation & Inheritance
class StripeGateway : public PaymentGateway {
private:
    std::string apiKey; // Encapsulated private credential

public:
    StripeGateway(const std::string& key) : apiKey(key) {}

    // 4. Runtime Polymorphism
    void processPayment(double amount) override {
        std::cout << "Charged $" << amount << " via Stripe API\\n";
    }
};

int main() {
    PaymentGateway* gateway = new StripeGateway("sk_live_12345");
    gateway->processPayment(99.99); // Dynamic dispatch
    delete gateway;
    return 0;
}`,
            code_language: 'cpp',
            key_takeaways: JSON.stringify([
              'Encapsulation bundles data and restricts access via private fields.',
              'Abstraction exposes only essential interfaces via abstract classes.',
              'Runtime polymorphism executes the derived implementation via vtable dynamic dispatch.'
            ]),
            display_order: 1,
            assignments: [
              {
                id: 'asgn-oops-101-1',
                question: 'Which OOP pillar is primarily responsible for hiding the internal complexity of a system and only exposing a high-level public interface?',
                options_json: JSON.stringify([
                  'Inheritance',
                  'Abstraction',
                  'Encapsulation',
                  'Association'
                ]),
                correct_option_idx: 1,
                explanation_markdown: 'Abstraction focuses on hiding complex implementation details and showing only the essential features of an object via interfaces and abstract classes.',
                display_order: 1
              },
              {
                id: 'asgn-oops-101-2',
                question: 'How does runtime polymorphism (method overriding) differ from compile-time polymorphism (method overloading)?',
                options_json: JSON.stringify([
                  'Method overriding is resolved at runtime via dynamic dispatch (vtable), while overloading is resolved at compile time by signature.',
                  'Method overriding can only exist in private classes.',
                  'Method overloading requires virtual functions.',
                  'There is no difference in compiled machine code.'
                ]),
                correct_option_idx: 0,
                explanation_markdown: 'Method overloading has different parameter signatures resolved by the compiler at compile-time. Method overriding uses identical signatures in derived classes and is dynamically dispatched at runtime via the virtual method table (vtable).',
                display_order: 2
              }
            ]
          }
        ]
      }
    ]
  }
]

export function seedCoreCsCourseData(db) {
  const insertCourse = db.prepare(`
    INSERT OR IGNORE INTO core_cs_courses (id, subject, title, description, icon, color, display_order)
    VALUES (@id, @subject, @title, @description, @icon, @color, @display_order)
  `)

  const insertModule = db.prepare(`
    INSERT OR IGNORE INTO core_cs_modules (id, course_id, title, description, module_number, display_order)
    VALUES (@id, @course_id, @title, @description, @module_number, @display_order)
  `)

  const insertLesson = db.prepare(`
    INSERT OR IGNORE INTO core_cs_lessons (
      id, module_id, title, slug, reading_time_minutes, analogy_markdown,
      content_markdown, diagram_ascii, code_snippet, code_language,
      key_takeaways, display_order
    ) VALUES (
      @id, @module_id, @title, @slug, @reading_time_minutes, @analogy_markdown,
      @content_markdown, @diagram_ascii, @code_snippet, @code_language,
      @key_takeaways, @display_order
    )
  `)

  const insertAssignment = db.prepare(`
    INSERT OR IGNORE INTO core_cs_assignments (
      id, lesson_id, question, options_json, correct_option_idx, explanation_markdown, display_order
    ) VALUES (
      @id, @lesson_id, @question, @options_json, @correct_option_idx, @explanation_markdown, @display_order
    )
  `)

  const transaction = db.transaction(() => {
    for (const course of coursesData) {
      insertCourse.run({
        id: course.id,
        subject: course.subject,
        title: course.title,
        description: course.description,
        icon: course.icon,
        color: course.color,
        display_order: course.display_order,
      })

      for (const mod of course.modules) {
        insertModule.run({
          id: mod.id,
          course_id: course.id,
          title: mod.title,
          description: mod.description,
          module_number: mod.module_number,
          display_order: mod.display_order,
        })

        for (const les of mod.lessons) {
          insertLesson.run({
            id: les.id,
            module_id: mod.id,
            title: les.title,
            slug: les.slug,
            reading_time_minutes: les.reading_time_minutes,
            analogy_markdown: les.analogy_markdown || null,
            content_markdown: les.content_markdown,
            diagram_ascii: les.diagram_ascii || null,
            code_snippet: les.code_snippet || null,
            code_language: les.code_language || null,
            key_takeaways: les.key_takeaways || '[]',
            display_order: les.display_order,
          })

          if (Array.isArray(les.assignments)) {
            for (const asgn of les.assignments) {
              insertAssignment.run({
                id: asgn.id,
                lesson_id: les.id,
                question: asgn.question,
                options_json: asgn.options_json,
                correct_option_idx: asgn.correct_option_idx,
                explanation_markdown: asgn.explanation_markdown,
                display_order: asgn.display_order,
              })
            }
          }
        }
      }
    }
  })

  transaction()
  console.log(`[Core CS Course Seeder] Successfully seeded interactive courses, modules, lessons, and assignments.`)
}
