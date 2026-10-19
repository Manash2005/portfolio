// Curated Catalog for Core CS Fundamentals & Active Recall Arena
// Covers OS, DBMS & SQL, Computer Networks, System Design, and OOPs & LLD

export const curatedCards = [
  // ==========================================
  // OPERATING SYSTEMS (OS)
  // ==========================================
  {
    id: 'cs-os-001',
    subject: 'OS',
    subtopic: 'Processes & Threads',
    title: 'Process vs Thread Memory Architecture & Context Switch',
    question: 'How do processes and threads differ in terms of memory layout, resource sharing, and context switching overhead?',
    answer_markdown: `### Core Difference
- A **Process** is an executing instance of a program with an **isolated, dedicated virtual address space** (Code, Data, Heap, Stack). Processes communicate via Inter-Process Communication (IPC: pipes, sockets, shared memory).
- A **Thread** is the smallest unit of execution within a process (often called a *lightweight process*). All threads in the same process **share the Code, Data, and Heap segments**, but each thread maintains its own **private Stack, Program Counter (PC), and CPU Registers**.

### Context Switching Overhead
1. **Thread Context Switch**: Only saves CPU register state, Program Counter, and Stack Pointer. The virtual memory mappings remain identical, so the **TLB (Translation Lookaside Buffer) does NOT get flushed**. This makes thread context switches extremely fast (~1-2 microseconds).
2. **Process Context Switch**: In addition to saving CPU registers, the OS must switch the page table root pointer (e.g. \`CR3\` register in x86). This **invalidates and flushes the TLB cache**, causing subsequent memory accesses to incur multiple memory lookups (TLB misses), making it significantly heavier.`,
    key_takeaway: 'Threads share Heap and Code but have private Stacks; thread switches preserve the TLB, while process switches flush the TLB.',
    difficulty: 'High-Frequency',
    interview_frequency: 'Top 50 Must Know',
    code_snippet: `// In Linux (pthreads), threads share heap memory:
#include <pthread.h>
#include <stdio.h>

int shared_counter = 0; // Shared across all threads in process

void* worker(void* arg) {
    for (int i = 0; i < 1000; i++) shared_counter++;
    return NULL;
}`,
    code_language: 'cpp',
    diagram_ascii: `+-----------------------------------------------+
| Process Memory Space                          |
|  [ Code ]  [ Data / Globals ]  [ Shared Heap ] |
|  +-------------------+  +-------------------+ |
|  | Thread 1:         |  | Thread 2:         | |
|  | [ Registers, PC ] |  | [ Registers, PC ] | |
|  | [ Private Stack ] |  | [ Private Stack ] | |
|  +-------------------+  +-------------------+ |
+-----------------------------------------------+`,
  },
  {
    id: 'cs-os-002',
    subject: 'OS',
    subtopic: 'Synchronization & Concurrency',
    title: 'Mutex vs Counting Semaphore & Priority Inversion',
    question: 'What is the fundamental difference between a Mutex and a Semaphore? Can a thread unlock a semaphore locked by another thread?',
    answer_markdown: `### Mutex (Mutual Exclusion)
- A **Mutex** has the concept of **ownership**: only the specific thread that acquired (locked) the mutex is legally allowed to release (unlock) it.
- Used strictly for mutual exclusion to protect a critical section.
- Typically implemented using atomic CPU instructions like \`test-and-set\` or \`compare-and-swap\` (CAS), backed by OS futexes.

### Counting Semaphore
- A **Semaphore** is a signaling mechanism (counter-based). It does **NOT have ownership**.
- Any thread can increment (\`V()\` / \`post()\` / \`signal()\`) or decrement (\`P()\` / \`wait()\`) the semaphore.
- **Yes!** A thread can signal/unlock a semaphore that was waited on by another thread. This makes semaphores ideal for Producer-Consumer coordination.

### Priority Inversion
- Occurs when a high-priority task is blocked waiting for a resource held by a low-priority task, and a medium-priority task preempts the low-priority task, delaying the high-priority task indefinitely.
- **Solution**: **Priority Inheritance Protocol** (the low-priority thread temporarily inherits the high priority until it releases the mutex).`,
    key_takeaway: 'A Mutex enforces strict thread ownership; a Semaphore is a signaling counter with no ownership.',
    difficulty: 'High-Frequency',
    interview_frequency: 'Top 50 Must Know',
    code_snippet: `// C++ POSIX Semaphore vs Mutex
pthread_mutex_t mtx = PTHREAD_MUTEX_INITIALIZER;
sem_t sem;
sem_init(&sem, 0, 3); // Counting semaphore initialized to 3 concurrent slots`,
    code_language: 'cpp',
    diagram_ascii: `Mutex:     [ Thread A (Locks) ] ---> [ Critical Section ] ---> [ Thread A (Unlocks) ]
Semaphore: [ Producer (Signals V) ] ---> [ Counter: N ] <--- [ Consumer (Waits P) ]`,
  },
  {
    id: 'cs-os-003',
    subject: 'OS',
    subtopic: 'Deadlocks',
    title: 'The 4 Coffman Conditions & Banker\'s Algorithm',
    question: 'What are the 4 essential Coffman conditions required for a Deadlock? How does Banker\'s Algorithm prevent it?',
    answer_markdown: `### The 4 Coffman Conditions
A deadlock can **only occur if ALL FOUR** of the following conditions hold simultaneously:
1. **Mutual Exclusion**: At least one resource must be held in a non-shareable mode (only one process can use it at a time).
2. **Hold and Wait**: A process must currently hold at least one resource while waiting to acquire additional resources held by others.
3. **No Preemption**: Resources cannot be forcibly taken away; they can only be released voluntarily by the holding process.
4. **Circular Wait**: A closed chain of processes exists: $P_0$ waits for resource held by $P_1$, $P_1$ waits for $P_2$, ..., and $P_n$ waits for $P_0$.

### Breaking Deadlocks
- Break **Mutual Exclusion**: Use lock-free data structures or virtualize resources (e.g. spooling printers).
- Break **Hold and Wait**: Require a process to request all needed resources at once before starting.
- Break **No Preemption**: If a process holding resources is denied further requests, it must release all current allocations.
- Break **Circular Wait (Most Common)**: Impose a **global strict numerical ordering** on all resources; processes can only request resources in strictly increasing order.

### Banker's Algorithm
- An avoidance algorithm for systems with multiple resource instances.
- Checks whether granting a request leaves the system in a **Safe State** (where there exists an execution sequence allowing all processes to finish without deadlock) using:
  $$\\text{Need}[i][j] = \\text{Max}[i][j] - \\text{Allocation}[i][j]$$`,
    key_takeaway: 'Deadlocks require all 4 Coffman conditions; breaking Circular Wait via strict resource ordering is the standard industry solution.',
    difficulty: 'High-Frequency',
    interview_frequency: 'Top 50 Must Know',
    diagram_ascii: `Circular Wait Cycle:
   [ Process P1 ] -- holds R1 --> requests R2 --+
         ^                                      |
         |                                      v
         +-- requests R1 <-- holds R2 -- [ Process P2 ]`,
  },
  {
    id: 'cs-os-004',
    subject: 'OS',
    subtopic: 'Memory Management & Paging',
    title: 'Virtual Memory, Multi-Level Paging & TLB Miss Handling',
    question: 'Walk through how the CPU MMU translates a Virtual Address to a Physical Address. What happens on a TLB miss?',
    answer_markdown: `### Address Translation Flow
1. The CPU generates a **Virtual Address**, split into **Virtual Page Number (VPN)** and **Page Offset**.
2. **Step 1 (TLB Lookup)**: The Memory Management Unit (MMU) checks the hardware **TLB (Translation Lookaside Buffer)** cache.
   - **TLB Hit**: Physical Frame Number (PFN) retrieved in 1 CPU cycle. Physical Address = $\\text{PFN} + \\text{Offset}$.
   - **TLB Miss**: The MMU must perform a **Page Table Walk** in RAM.

### Multi-Level Paging Walk
In a 64-bit 4-level paging architecture (e.g. x86-64: PML4 -> PDPT -> PD -> PT):
- MMU uses the page table base pointer in register \`CR3\`.
- Each level indexes an entry pointing to the physical base of the next table.
- The final Page Table Entry (PTE) contains the physical frame number and permission bits (Read/Write/User/NX).

### Page Fault Handling
If the PTE's **Present bit is 0**:
1. CPU triggers a hardware interrupt: **Page Fault (Trap #14)**.
2. OS kernel looks up the Virtual Memory Area (VMA).
3. If invalid address -> sends \`SIGSEGV\` (Segmentation Fault).
4. If valid (swapped out or demand-paged binary):
   - OS allocates a free physical frame (or evicts via LRU page replacement).
   - Reads page content from disk/swap space via DMA.
   - Updates the PTE with the new PFN and sets Present bit = 1.
   - Refreshes TLB and restarts the faulting instruction seamlessly.`,
    key_takeaway: 'MMU checks TLB first; on miss, walks page table levels in memory; if Present bit is 0, triggers Page Fault to load frame from disk.',
    difficulty: 'High-Frequency',
    interview_frequency: 'Tier-1 Tech Favorite',
    diagram_ascii: `Virtual Address: [ Page Number (VPN) | Offset ]
        |
        v
    [ TLB Cache ] ----(HIT)---> [ Frame Number (PFN) | Offset ] -> Physical RAM
        |
     (MISS)
        v
[ Page Table Walk ] ---> Present Bit == 0? ---> [ OS Page Fault Handler ] -> Disk Read`,
  },

  // ==========================================
  // DBMS & SQL
  // ==========================================
  {
    id: 'cs-dbms-001',
    subject: 'DBMS',
    subtopic: 'ACID & Transactions',
    title: 'ACID Properties Deep-Dive & Write-Ahead Logging (WAL)',
    question: 'How do relational databases physically guarantee Atomicity and Durability during unexpected power failure or crashes?',
    answer_markdown: `### The ACID Guarantee
- **Atomicity**: All operations in a transaction succeed, or the entire transaction is rolled back with zero side effects.
- **Consistency**: The database transitions only between valid states satisfying all constraints, cascades, and triggers.
- **Isolation**: Concurrent transactions execute as if they were running serially without interfering.
- **Durability**: Once a transaction is committed, its updates are guaranteed to survive any system crash or power outage.

### How Atomicity & Durability are Enforced: WAL (Write-Ahead Logging)
Databases cannot afford to flush dirty data pages from the in-memory **Buffer Pool** to disk tables synchronously on every commit because random disk I/O is too slow.

Instead, they employ **Write-Ahead Logging (WAL)**:
1. **Core Rule**: Before any modified data page is flushed to the actual table file on disk, the corresponding log record must be appended to the sequential WAL file on disk and flushed with \`fsync()\`.
2. **Sequential Append**: WAL writes are sequential (fast), while table writes are random (slow).
3. **Crash Recovery (ARIES Algorithm)**:
   - **Analysis Phase**: Scans WAL forward from the last checkpoint to identify dirty pages and active uncommitted transactions.
   - **Redo Phase**: Replays all committed changes from the log to restore the database to the exact state before the crash (**guarantees Durability**).
   - **Undo Phase**: Scans backwards and rolls back changes from transactions that never committed (**guarantees Atomicity**).`,
    key_takeaway: 'WAL guarantees Atomicity and Durability by sequentially persisting transaction logs with fsync before writing random dirty data pages.',
    difficulty: 'High-Frequency',
    interview_frequency: 'Top 50 Must Know',
    code_snippet: `BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT; -- Trigger WAL append and synchronous fsync()`,
    code_language: 'sql',
    diagram_ascii: `[ Client Query ] ---> [ Buffer Pool (RAM) ] --(Random Writes)--> [ Data Tables (Disk) ]
          |
          +--(Sequential Append)--> [ WAL Log (Disk) + fsync() ] (Fast & Durable)`,
  },
  {
    id: 'cs-dbms-002',
    subject: 'DBMS',
    subtopic: 'Indexing & Storage Engines',
    title: 'B-Tree vs B+ Tree: Why Databases Use B+ Trees for Indexes',
    question: 'Why do databases like MySQL (InnoDB) and PostgreSQL use B+ Trees instead of B-Trees or Binary Search Trees for disk indexes?',
    answer_markdown: `### B-Tree vs B+ Tree Structural Differences
1. **B-Tree**: Data records (or row pointers) are stored inside **both internal nodes and leaf nodes**.
2. **B+ Tree**:
   - **Internal nodes only store keys and routing pointers** (no data rows).
   - **ALL actual data records/pointers are stored exclusively in the leaf nodes**.
   - **Leaf nodes are linked together as a doubly-linked list**.

### Why B+ Trees Win for Database Systems
1. **Higher Branching Factor (Shallower Height)**:
   - Because internal nodes don't store row payloads, a single 16KB disk page can hold hundreds of keys.
   - A 3-level or 4-level B+ Tree can index **billions of rows** with only 3 to 4 disk I/O operations!
2. **Blazing Fast Range Scans**:
   - In a B-Tree, a range query (e.g. \`WHERE age BETWEEN 20 AND 30\`) requires traversing up and down the tree across levels.
   - In a B+ Tree, the engine traverses down to the first leaf node once, then simply **scans linearly along the leaf linked list**!
3. **Predictable Query Latency**:
   - Every lookup traverses the exact same tree depth to a leaf node, providing consistent $O(\\log_B N)$ performance.`,
    key_takeaway: 'B+ trees keep only routing keys in internal nodes (maximizing fanout) and link all leaves for O(1) sequential range queries.',
    difficulty: 'High-Frequency',
    interview_frequency: 'Top 50 Must Know',
    diagram_ascii: `B+ Tree Architecture:
            [  50  |  100  ]              <-- Internal routing keys only
           /       |        \\
   [ 10 | 25 ]  [ 60 | 80 ]  [ 110 | 150 ]
       |            |              |
       v            v              v
   [Leaf 1] <---> [Leaf 2] <---> [Leaf 3]  <-- Doubly linked list with row data!`,
  },
  {
    id: 'cs-dbms-003',
    subject: 'DBMS',
    subtopic: 'Concurrency & Isolation Levels',
    title: 'The 4 SQL Isolation Levels & Concurrency Read Phenomena',
    question: 'Explain the 3 classic concurrency phenomena (Dirty Read, Non-Repeatable Read, Phantom Read) and how the 4 SQL isolation levels prevent them.',
    answer_markdown: `### The 3 Concurrency Read Anomalies
1. **Dirty Read**: Transaction $T_1$ reads uncommitted data written by transaction $T_2$. If $T_2$ rolls back, $T_1$ operated on nonexistent phantom data.
2. **Non-Repeatable Read (Fuzzy Read)**: Transaction $T_1$ reads a row. Transaction $T_2$ updates or deletes that same row and commits. When $T_1$ re-reads the row, its values have changed.
3. **Phantom Read**: Transaction $T_1$ executes a range query (e.g. \`WHERE age > 25\`). Transaction $T_2$ inserts a new row matching that range and commits. When $T_1$ re-executes the query, a new "phantom" row appears.

### SQL-92 Isolation Levels Matrix
| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read | Mechanism (Locking / MVCC) |
| :--- | :---: | :---: | :---: | :--- |
| **Read Uncommitted** | Allowed | Allowed | Allowed | No read locks; reads raw buffer memory |
| **Read Committed** | **Prevented** | Allowed | Allowed | Reads latest committed snapshot per statement |
| **Repeatable Read** | **Prevented** | **Prevented** | Allowed (prevented in InnoDB via Next-Key Locks) | Snapshot taken at start of transaction |
| **Serializable** | **Prevented** | **Prevented** | **Prevented** | Two-Phase Locking (2PL) or SSI (Serializable Snapshot) |`,
    key_takeaway: 'Read Committed prevents Dirty Reads; Repeatable Read freezes row values; Serializable prevents Phantom range insertions.',
    difficulty: 'High-Frequency',
    interview_frequency: 'Top 50 Must Know',
    code_snippet: `-- Set isolation level in MySQL / Postgres:
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
SELECT * FROM users WHERE status = 'active'; -- Establishes consistent read view
COMMIT;`,
    code_language: 'sql',
  },
  {
    id: 'cs-dbms-004',
    subject: 'DBMS',
    subtopic: 'Advanced SQL',
    title: 'Window Functions: ROW_NUMBER(), RANK() vs DENSE_RANK()',
    question: 'How do ROW_NUMBER(), RANK(), and DENSE_RANK() handle tied values? Provide a real interview query to find the N-th highest salary.',
    answer_markdown: `### The Difference with Tied Values
Suppose we have salaries: \`[1000, 900, 900, 800]\`:
1. **\`ROW_NUMBER()\`**: Strictly assigns sequential integers without regard for ties:
   - Values: \`1000 -> 1\`, \`900 -> 2\`, \`900 -> 3\`, \`800 -> 4\`
2. **\`RANK()\`**: Gives ties identical rank, but **skips subsequent positions** (gap):
   - Values: \`1000 -> 1\`, \`900 -> 2\`, \`900 -> 2\`, \`800 -> 4\` (Rank 3 was skipped!)
3. **\`DENSE_RANK()\`**: Gives ties identical rank **without skipping** any ranks:
   - Values: \`1000 -> 1\`, \`900 -> 2\`, \`900 -> 2\`, \`800 -> 3\` (Continuous sequence)

### Canonical Interview Question: N-th Highest Salary
Using \`DENSE_RANK()\` and a Common Table Expression (CTE) handles ties cleanly:`,
    key_takeaway: 'ROW_NUMBER assigns distinct numbers; RANK leaves gaps after ties; DENSE_RANK maintains consecutive rank values without gaps.',
    difficulty: 'Standard',
    interview_frequency: 'Top 50 Must Know',
    code_snippet: `WITH RankedSalaries AS (
  SELECT 
    id, 
    department_id, 
    salary,
    DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rank_pos
  FROM employees
)
SELECT department_id, salary 
FROM RankedSalaries 
WHERE rank_pos = 2; -- Finds 2nd highest salary per department`,
    code_language: 'sql',
  },

  // ==========================================
  // COMPUTER NETWORKS (CN)
  // ==========================================
  {
    id: 'cs-cn-001',
    subject: 'CN',
    subtopic: 'Transport Layer Protocols',
    title: 'TCP 3-Way Handshake & 4-Way Teardown (TIME_WAIT Deep Dive)',
    question: 'Explain the TCP 3-way handshake and 4-way teardown. Why does the client enter TIME_WAIT for 2*MSL instead of terminating immediately?',
    answer_markdown: `### TCP 3-Way Handshake (Connection Establishment)
1. **Client -> Server [SYN]**: Client picks random initial sequence number $ISN_C$ and sends \`SYN, Seq=x\`.
2. **Server -> Client [SYN-ACK]**: Server allocates buffers, picks $ISN_S$, and sends \`SYN-ACK, Seq=y, Ack=x+1\`.
3. **Client -> Server [ACK]**: Client sends \`ACK, Seq=x+1, Ack=y+1\`. Connection is now \`ESTABLISHED\` (can carry data payload).

### TCP 4-Way Teardown (Connection Termination)
Because TCP is **full-duplex**, each direction must be closed independently:
1. **Client -> Server [FIN]**: Client finished sending data.
2. **Server -> Client [ACK]**: Server acknowledges closure; can still send remaining data.
3. **Server -> Client [FIN]**: Server finishes sending data.
4. **Client -> Server [ACK]**: Client acknowledges server closure.

### Why is \`TIME_WAIT\` State Necessary (2 * MSL)?
The client waits **$2 \\times \\text{MSL}$ (Maximum Segment Lifetime, typically 60-120s)** before finally freeing the socket:
1. **To safely deliver the final ACK**: If the client's final ACK is dropped in transit, the server retransmits its FIN. If the client had closed immediately, it would reply with an \`RST\` error packet, causing an abnormal abort instead of a clean shutdown.
2. **To drain delayed duplicate packets from the network**: Prevents late packets from an old closed connection from accidentally corrupting a brand-new connection opening on the same IP and port combination.`,
    key_takeaway: 'TCP handshake synchronizes initial sequence numbers; TIME_WAIT lasts 2*MSL to guarantee final ACK delivery and drain lingering packets.',
    difficulty: 'High-Frequency',
    interview_frequency: 'Top 50 Must Know',
    diagram_ascii: `Client                                 Server
  | ----- [SYN, Seq=x] ------------->   |  (SYN_SENT -> SYN_RCVD)
  | <---- [SYN-ACK, Seq=y, Ack=x+1] -   |
  | ----- [ACK, Seq=x+1, Ack=y+1] -->   |  (ESTABLISHED)
  ...
  | ----- [FIN] -------------------->   |
  | <---- [ACK] ---------------------   |  (CLOSE_WAIT)
  | <---- [FIN] ---------------------   |
  | ----- [ACK] -------------------->   |  (TIME_WAIT: 2*MSL) -> CLOSED`,
  },
  {
    id: 'cs-cn-002',
    subject: 'CN',
    subtopic: 'Application Layer & Web',
    title: 'HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC Architecture)',
    question: 'How did HTTP/2 solve Head-of-Line (HoL) blocking, and why was HTTP/3 needed over UDP to completely eliminate it?',
    answer_markdown: `### 1. HTTP/1.1 Limitations
- **Head-of-Line (HoL) Blocking at Application Layer**: Browsers can only send 1 request per TCP connection at a time. A slow response blocks all subsequent requests on that socket.
- **Workaround**: Browsers opened up to 6 parallel TCP connections per domain, causing heavy handshake overhead and congestion.

### 2. HTTP/2 Innovations (Binary Framing & Multiplexing)
- **Single TCP Connection**: All requests share one persistent TCP connection.
- **Multiplexed Streams**: Breaks messages into independent **binary frames** with stream IDs. Responses can arrive out of order and interleaved.
- **Header Compression**: Uses **HPACK** to eliminate redundant header bloat.
- **The Residual Problem**: **Transport-Layer HoL Blocking!** Because HTTP/2 still runs over a single TCP connection, if just **one packet is dropped** by network congestion, TCP stops all streams until that missing packet is retransmitted and acknowledged!

### 3. HTTP/3 & QUIC (Over UDP)
- Completely replaces TCP with **QUIC (Quick UDP Internet Connections)** running on top of UDP.
- **Stream Independence**: Each HTTP request/response stream in QUIC has its own independent packet sequence. Dropping packet in Stream A does **NOT** block or delay Stream B!
- **0-RTT Connection Establishment**: Integrates TLS 1.3 handshake with transport handshake in a single round trip.
- **Connection Migration**: Uses a 64-bit Connection ID instead of 4-tuple IP:Port, allowing smooth handoff when your mobile switches from Wi-Fi to 5G without disconnecting.`,
    key_takeaway: 'HTTP/2 multiplexes streams over single TCP; HTTP/3 moves to QUIC over UDP to eliminate TCP transport-layer Head-of-Line blocking.',
    difficulty: 'High-Frequency',
    interview_frequency: 'Top 50 Must Know',
    diagram_ascii: `HTTP/1.1: [ Req 1 ] -> [ Res 1 ] -> [ Req 2 ] -> [ Res 2 ] (Application HoL Blocking)
HTTP/2:   [ Stream 1 | Stream 2 | Stream 1 | Stream 3 ] over single TCP (Transport HoL if 1 packet lost)
HTTP/3:   [ Stream 1 (UDP) ]  ||  [ Stream 2 (UDP) ] -> Fully independent! No HoL blocking!`,
  },
  {
    id: 'cs-cn-003',
    subject: 'CN',
    subtopic: 'Transport Layer Protocols',
    title: 'TCP Congestion Control: AIMD, Slow Start & Fast Retransmit',
    question: 'How does TCP dynamically probe network capacity without blowing up routers? Explain Slow Start and Congestion Avoidance.',
    answer_markdown: `### The Congestion Window (\`cwnd\`)
TCP maintains a **Congestion Window (\`cwnd\`)** representing the number of unacknowledged packets allowed in transit. The effective window is:
$$\\text{Window} = \\min(\\text{cwnd}, \\text{rwnd})$$
(where \`rwnd\` is the receiver's advertised buffer space).

### The Phases of TCP Congestion Control
1. **Slow Start**:
   - Begins conservatively with small \`cwnd\` (e.g. 10 MSS).
   - For every ACK received, \`cwnd\` increases by 1 MSS.
   - Result: \`cwnd\` **doubles every RTT (exponential growth: 1, 2, 4, 8, 16...)** until it reaches the threshold \`ssthresh\`.
2. **Congestion Avoidance (AIMD - Additive Increase / Multiplicative Decrease)**:
   - When $\\text{cwnd} \\ge \\text{ssthresh}$, growth switches to linear: increases by 1 MSS per RTT (**Additive Increase**).
3. **Loss Event Handling**:
   - **Triple Duplicate ACKs** (Mild congestion / packet loss):
     - Indicates subsequent packets got through, but one was dropped.
     - **Fast Retransmit**: Retransmits missing packet immediately without waiting for timeout.
     - **Fast Recovery**: Sets $\\text{ssthresh} = \\text{cwnd} / 2$, reducing window by half (**Multiplicative Decrease**).
   - **Retransmission Timeout (RTO)** (Severe congestion):
     - Resets $\\text{cwnd} = 1$ MSS and restarts in Slow Start.`,
    key_takeaway: 'TCP grows exponentially in Slow Start, climbs linearly in Congestion Avoidance, and cuts window in half on packet loss (AIMD).',
    difficulty: 'High-Frequency',
    interview_frequency: 'Tier-1 Tech Favorite',
    diagram_ascii: `cwnd
  ^
  |          /\\  (Packet loss -> cut in half)
  |         /  \\      /\\
  |        /    \\    /  \\   <- Linear AIMD slope
  |  /|   /      \\  /    \\
  | / |  /        \\/
  +------------------------> Time (RTTs)
   Slow Start (Exponential)`,
  },

  // ==========================================
  // SYSTEM DESIGN (HLD)
  // ==========================================
  {
    id: 'cs-sd-001',
    subject: 'System Design',
    subtopic: 'Scalability & Load Balancing',
    title: 'Consistent Hashing with Virtual Nodes in Distributed Caches',
    question: 'Why does naive modular hashing (hash(key) % N) fail when scaling distributed caches? How does Consistent Hashing solve this?',
    answer_markdown: `### The Flaw with Naive Modulo Hashing
In a cluster with $N$ cache servers, storing a key via $\\text{server} = \\text{hash}(\\text{key}) \\pmod N$ works until:
- A server crashes ($N \\to N - 1$), or
- A new server is added ($N \\to N + 1$).
- **The Disaster**: Almost **100% of existing keys remap to new servers**! This invalidates the entire cache cluster simultaneously, causing a catastrophic **Cache Avalanche / Stampede** that crushes the origin database.

### Consistent Hashing Architecture
1. **The Hash Ring**: The output range of the hash function (e.g. SHA-1: $0$ to $2^{160}-1$) is mapped conceptually to a continuous circle.
2. **Server Placement**: Server IDs/IPs are hashed and placed at positions along the ring.
3. **Key Placement**: To locate a key, hash the key and walk **clockwise** along the ring until encountering the first server node.
4. **Minimal Remapping**: When a server is added or removed, **only keys between the departed node and its predecessor are affected** (on average only $K / N$ keys remapped!).

### The Hotspot Problem & Virtual Nodes
- If physical nodes are unevenly spaced on the ring, one server might handle 60% of the hash range.
- **Solution (Virtual Nodes / V-Nodes)**: Each physical server is assigned multiple positions (e.g. 100-200 virtual nodes) on the ring: \`ServerA#1\`, \`ServerA#2\`, \`ServerB#1\`...
- This distributes keys uniformly across all servers and provides seamless rebalancing if a node dies.`,
    key_takeaway: 'Consistent Hashing maps servers and keys onto a ring; adding/removing servers only remaps K/N keys, and virtual nodes ensure uniform load.',
    difficulty: 'High-Frequency',
    interview_frequency: 'Top 50 Must Know',
    diagram_ascii: `Consistent Hash Ring (0 to 2^160 - 1):
           [ Server A #1 ]
          /               \\
 [ Key 1 ]                 [ Server B #1 ]
     |                          |
     v (walks clockwise)        v
  [ Server A #1 ]          [ Key 2 ] -> [ Server C #1 ]
          \\               /
           [ Server C #1 ]`,
  },
  {
    id: 'cs-sd-002',
    subject: 'System Design',
    subtopic: 'Caching Strategies',
    title: 'Cache-Aside, Write-Through vs Write-Behind (Write-Back)',
    question: 'Compare Cache-Aside, Write-Through, and Write-Behind caching patterns. Which pattern is best for read-heavy vs write-heavy workloads?',
    answer_markdown: `### 1. Cache-Aside (Lazy Loading) - Most Common
- **Read Path**: The application queries the cache first. On cache miss, it reads from DB, writes to cache, and returns.
- **Write Path**: Application writes directly to the DB, then **invalidates (deletes)** the cache entry.
- **Pros**: Resilience (cache failure doesn't break reads; DB handles it). Cache contains only data actually requested.
- **Cons**: Cache miss penalty on cold starts; potential temporary stale data if updates are concurrent.

### 2. Write-Through
- **Write Path**: Application writes to the cache; the cache synchronously writes to the DB before returning success.
- **Pros**: Cache is never stale; high data consistency.
- **Cons**: Write latency penalty (two writes per update); caches data that may never be read again unless combined with TTL.

### 3. Write-Behind (Write-Back)
- **Write Path**: Application writes to cache, which immediately responds. The cache asynchronously batches and writes updates to the database in the background.
- **Pros**: **Ultra-low write latency** and massive write throughput (great for view counters, metrics, analytics).
- **Cons**: Risk of **data loss** if the cache node crashes before flushing dirty writes to the durable database!`,
    key_takeaway: 'Cache-Aside is best for general read-heavy workloads; Write-Through prioritizes consistency; Write-Behind maximizes write throughput at risk of loss.',
    difficulty: 'High-Frequency',
    interview_frequency: 'Top 50 Must Know',
    diagram_ascii: `Cache-Aside:   App ---> (1. Check Cache) ---> Cache
                 |
                 +-----> (2. On Miss: Read DB) ---> DB

Write-Through:  App ---> Cache ---(Synchronous)---> DB
Write-Behind:   App ---> Cache ---(Async Batch Queue)--> DB`,
  },
  {
    id: 'cs-sd-003',
    subject: 'System Design',
    subtopic: 'Distributed Systems & Consistency',
    title: 'The CAP Theorem & PACELC: Real-World Trade-Offs',
    question: 'Why is "Pick 2 of 3" a misleading description of the CAP theorem? How does the PACELC theorem provide a more realistic picture?',
    answer_markdown: `### Why "Pick 2 out of 3" is Misleading
In any real-world distributed system operating across networks:
- **Network Partitions (P) are an inevitable physical reality** (cables get cut, switches fail, latency spikes).
- Therefore, you **cannot choose "CA"** in a distributed architecture!
- When a partition occurs, your system is forced to make a trade-off:
  - **CP (Consistency over Availability)**: Reject writes or return errors rather than risk returning inconsistent, stale data (e.g. ZooKeeper, etcd, Spanner, Redis cluster).
  - **AP (Availability over Consistency)**: Accept writes on both sides of the network split, returning stale reads and resolving conflicts later via CRDTs or vector clocks (e.g. Cassandra, DynamoDB).

### The PACELC Theorem
CAP only describes system behavior **during an active network partition**. But systems operate normally 99.9% of the time!

**PACELC states**:
$$\\text{If Partition (P) } \\to \\text{ Choose Availability (A) or Consistency (C);}$$
$$\\text{Else (E) } \\to \\text{ Choose Latency (L) or Consistency (C).}$$

- **PC/EC (e.g. Spanner, Postgres Multi-Master)**: When partitioned choose Consistency; in normal state pay the latency cost for synchronous replication.
- **PA/EL (e.g. DynamoDB, Cassandra)**: When partitioned choose Availability; in normal state serve fast reads from nearest replica (Latency over strict Consistency).`,
    key_takeaway: 'Partitions are inevitable so you choose CP or AP during splits; PACELC adds the normal-state trade-off between Latency and Consistency.',
    difficulty: 'High-Frequency',
    interview_frequency: 'Tier-1 Tech Favorite',
  },
  {
    id: 'cs-sd-004',
    subject: 'System Design',
    subtopic: 'Distributed Building Blocks',
    title: 'Rate Limiting Algorithms: Token Bucket vs Sliding Window Counter',
    question: 'How does the Token Bucket rate limiter work compared to Sliding Window Counter? Which prevents bursting at window boundaries?',
    answer_markdown: `### 1. Token Bucket Algorithm (Industry Standard: Stripe, AWS)
- A bucket holds up to $B$ tokens.
- Refilled at a steady rate of $R$ tokens per second.
- When a request arrives:
  - If tokens available: deduct 1 token and process request.
  - If bucket empty: reject request (HTTP 429 Too Many Requests).
- **Pros**: Supports controlled bursts (up to bucket capacity $B$) while strictly enforcing long-term rate $R$. Memory footprint is tiny (only stores timestamp and current count).

### 2. Fixed Window Counter (The Flawed Approach)
- Counts requests in fixed time windows (e.g. 100 req / minute).
- **The Boundary Burst Flaw**: A client sends 100 requests at 00:59, and another 100 requests at 01:01. The server receives **200 requests in 2 seconds**, doubling allowed capacity and crashing!

### 3. Sliding Window Counter (Smooth Hybrid)
- Blends the previous window's count with the current window:
  $$\\text{Est. Count} = (\\text{Prev Count} \\times (1 - \\text{progress})) + \\text{Curr Count}$$
- Smooths out boundary spikes with low memory overhead ($O(1)$ counters).`,
    key_takeaway: 'Token Bucket allows controlled bursts with steady refill; Sliding Window Counter prevents boundary spikes by weighting overlapping windows.',
    difficulty: 'Standard',
    interview_frequency: 'Top 50 Must Know',
    code_snippet: `// Token Bucket refill math in Redis / Go:
now = currentTimeSeconds()
tokens = min(max_capacity, tokens + (now - last_refill_time) * refill_rate)
if tokens >= 1:
    tokens -= 1
    return ALLOW
else:
    return RATE_LIMITED_429`,
    code_language: 'python',
  },

  // ==========================================
  // OOPS & LOW-LEVEL DESIGN (LLD)
  // ==========================================
  {
    id: 'cs-oop-001',
    subject: 'OOPs',
    subtopic: 'SOLID Principles',
    title: 'SOLID Principles with Real Code & Antipatterns',
    question: 'Explain each of the 5 SOLID principles with concrete examples and common antipattern violations.',
    answer_markdown: `### S - Single Responsibility Principle (SRP)
- *A class should have one, and only one, reason to change.*
- **Violation**: An \`Invoice\` class that calculates totals, saves itself to MySQL, and emails the PDF.
- **Fix**: Split into \`Invoice\`, \`InvoiceRepository\`, and \`EmailNotificationService\`.

### O - Open/Closed Principle (OCP)
- *Software entities should be open for extension, but closed for modification.*
- **Violation**: A \`PaymentProcessor\` class with a giant \`switch(type)\` statement that must be modified every time a new payment method is added.
- **Fix**: Define a \`PaymentStrategy\` interface; implement \`StripePayment\`, \`PayPalPayment\`.

### L - Liskov Substitution Principle (LSP)
- *Derived types must be completely substitutable for their base types without altering program correctness.*
- **Violation**: The classic \`Square extends Rectangle\` where setting width also alters height, breaking client assumptions.
- **Fix**: Inherit both from a common \`Shape\` interface.

### I - Interface Segregation Principle (ISP)
- *Clients should not be forced to depend upon interfaces they do not use.*
- **Violation**: A bloated \`Worker\` interface with \`code()\`, \`test()\`, and \`cookLunch()\`.
- **Fix**: Break into lean, cohesive interfaces: \`Developer\`, \`Tester\`.

### D - Dependency Inversion Principle (DIP)
- *High-level modules should not depend on low-level modules. Both should depend on abstractions.*
- **Violation**: \`OrderService\` directly instantiates \`MySQLDatabase db = new MySQLDatabase()\`.
- **Fix**: \`OrderService\` accepts a \`DatabaseConnection\` interface via constructor injection.`,
    key_takeaway: 'SOLID promotes loosely coupled, easily testable, and maintainable software through clear single responsibilities and interface abstractions.',
    difficulty: 'High-Frequency',
    interview_frequency: 'Top 50 Must Know',
    code_snippet: `// DIP in action (Constructor Dependency Injection):
interface PaymentGateway {
    void process(double amount);
}

class OrderService {
    private final PaymentGateway gateway;
    // High-level service depends on interface, not concrete Stripe/PayPal class!
    public OrderService(PaymentGateway gateway) {
        this.gateway = gateway;
    }
}`,
    code_language: 'java',
  },
  {
    id: 'cs-oop-002',
    subject: 'OOPs',
    subtopic: 'Design Patterns',
    title: 'Thread-Safe Singleton with Double-Checked Locking',
    question: 'Why does naive lazy Singleton initialization fail in multithreaded environments? How does Double-Checked Locking with volatile fix it?',
    answer_markdown: `### The Naive Lazy Singleton Problem
If two threads call \`getInstance()\` simultaneously when \`instance == null\`, both threads evaluate the check to true and instantiate two separate objects, violating the Singleton invariant!

### Why Simple Method Synchronization is Inefficient
Synchronizing the entire method (\`public static synchronized Singleton getInstance()\`) solves correctness, but **penalizes performance by 99%** because synchronization is only required on the very first creation call!

### Double-Checked Locking (DCL) Pattern
1. **First Check**: Check if instance is null without acquiring a lock. If initialized, return immediately (fast path).
2. **Synchronized Block**: If null, synchronize on the class object.
3. **Second Check**: Re-check if instance is still null (another thread might have acquired the lock first and initialized it).

### Why \`volatile\` is Crucial!
Without the \`volatile\` keyword, the CPU / JVM instruction reordering can reorder object construction:
1. Allocate memory.
2. Assign pointer to \`instance\` (instance is now non-null!).
3. Call constructor to initialize fields.
If thread B checks \`instance != null\` between steps 2 and 3, it receives an **uninitialized, broken object**! \`volatile\` guarantees memory visibility and prevents instruction reordering.`,
    key_takeaway: 'Double-checked locking minimizes synchronization overhead; the volatile keyword prevents CPU instruction reordering of uninitialized objects.',
    difficulty: 'High-Frequency',
    interview_frequency: 'Top 50 Must Know',
    code_snippet: `public class DatabaseConnectionPool {
    // volatile ensures memory barrier and visibility across threads
    private static volatile DatabaseConnectionPool instance;

    private DatabaseConnectionPool() { /* Connect to DB */ }

    public static DatabaseConnectionPool getInstance() {
        if (instance == null) {                         // 1st Check (No lock)
            synchronized (DatabaseConnectionPool.class) { // Synchronize
                if (instance == null) {                 // 2nd Check
                    instance = new DatabaseConnectionPool();
                }
            }
        }
        return instance;
    }
}`,
    code_language: 'java',
  },
  {
    id: 'cs-oop-003',
    subject: 'OOPs',
    subtopic: 'Design Patterns',
    title: 'Factory Method vs Abstract Factory Pattern',
    question: 'How does the Factory Method pattern differ from the Abstract Factory pattern in enterprise architecture?',
    answer_markdown: `### Factory Method Pattern (Inheritance-based)
- **Intent**: Defines an interface for creating a single object, but lets subclasses decide which concrete class to instantiate.
- **Mechanism**: Relies on class inheritance and overriding a factory method.
- **Example**: A \`Logistics\` base class with an abstract \`createTransport()\` method. Subclass \`RoadLogistics\` returns \`Truck\`, while \`SeaLogistics\` returns \`Ship\`.

### Abstract Factory Pattern (Composition-based)
- **Intent**: Provides an interface for creating **families of related or dependent objects** without specifying their concrete classes.
- **Mechanism**: Relies on object composition. The factory object itself is injected.
- **Example**: A cross-platform UI toolkit factory:
  - \`GUIFactory\` interface declares: \`createButton()\` and \`createCheckbox()\`.
  - Concrete Factory 1: \`WindowsFactory\` -> returns \`WindowsButton\` and \`WindowsCheckbox\`.
  - Concrete Factory 2: \`MacFactory\` -> returns \`MacButton\` and \`MacCheckbox\`.
  - Guarantees that Windows buttons are never accidentally paired with Mac checkboxes.`,
    key_takeaway: 'Factory Method creates a single product via inheritance; Abstract Factory creates families of related products via object composition.',
    difficulty: 'Standard',
    interview_frequency: 'Top 50 Must Know',
  },
  {
    id: 'cs-oop-004',
    subject: 'OOPs',
    subtopic: 'OOP Fundamentals',
    title: 'Polymorphism Internals: Virtual Method Tables (vtable & vptr)',
    question: 'How do C++ and Java physically implement runtime polymorphism under the hood? What is the memory cost of a virtual function?',
    answer_markdown: `### The Dynamic Dispatch Mechanism
When a class declares a \`virtual\` function (in C++) or a non-final method (in Java):
1. **The vtable (Virtual Table)**:
   - The compiler generates a static table of function pointers for the class.
   - Contains pointers to the most-derived implementation of each virtual function.
   - Only **one vtable exists per class type** (shared across all instances).
2. **The vptr (Virtual Pointer)**:
   - The compiler inserts a hidden pointer (\`vptr\`) into the **header of every object instance**.
   - Points directly to the class's vtable.
   - Adds 8 bytes of overhead per object on 64-bit systems.

### Execution Flow at Runtime: \`basePtr->speak()\`
1. Fetch object from memory.
2. Read the hidden \`vptr\` from the object header.
3. Index into the vtable at the fixed offset for \`speak()\`.
4. Dereference and call the function pointer.
- **Cost**: 1 extra memory indirection + disables compiler inlining optimizations.`,
    key_takeaway: 'Runtime polymorphism is powered by a per-class vtable of function pointers and a per-object 8-byte vptr pointing to that table.',
    difficulty: 'High-Frequency',
    interview_frequency: 'Tier-1 Tech Favorite',
    code_snippet: `class Animal {
public:
    virtual void speak() { cout << "Animal sound\\n"; }
};

class Dog : public Animal {
public:
    void speak() override { cout << "Woof!\\n"; } // vtable points here
};

Animal* a = new Dog();
a->speak(); // Look up vptr -> vtable[0] -> Dog::speak()`,
    code_language: 'cpp',
    diagram_ascii: `Object in Memory (Dog):
[ vptr (8 bytes) ] ------> [ Dog vtable in Read-Only Data ]
[ dog member variables ]    |
                            +--> &Dog::speak() function address`,
  },
]

export const curatedCheatSheets = [
  {
    id: 'cs-sheet-001',
    subject: 'OS',
    title: 'Process vs Thread Internals Contrast',
    summary: 'Rapid contrast of memory, scheduling, communication, and failure isolation boundaries.',
    comparison_table_json: JSON.stringify({
      columns: ['Feature', 'Process', 'Thread'],
      rows: [
        ['Address Space', 'Isolated private virtual address space', 'Shares process Code, Data, and Heap'],
        ['Stack & Registers', 'Own dedicated stack and registers', 'Own dedicated stack, registers, and PC'],
        ['Creation Cost', 'Heavy (fork/exec allocations)', 'Lightweight (fast clone)'],
        ['Context Switch', 'Slow (flushes hardware TLB)', 'Fast (preserves TLB cache)'],
        ['Communication (IPC)', 'Requires OS primitives (Pipes, Sockets, Shm)', 'Direct variable reads/writes on shared heap'],
        ['Crash Isolation', 'Isolated: crashing process leaves others intact', 'Shared: 1 thread segfault crashes whole process'],
      ]
    }),
    key_rules_json: JSON.stringify([
      'Threads share heap but never share stacks.',
      'Process switch requires changing page table base (CR3) which invalidates TLB.',
      'Use multi-process when fault isolation is mandatory; use multi-threading for fast shared-memory operations.'
    ])
  },
  {
    id: 'cs-sheet-002',
    subject: 'DBMS',
    title: '4 SQL Transaction Isolation Levels & Concurrency Anomalies',
    summary: 'The standard SQL-92 isolation matrix comparing Dirty Reads, Non-repeatable Reads, and Phantoms.',
    comparison_table_json: JSON.stringify({
      columns: ['Isolation Level', 'Dirty Read', 'Non-Repeatable Read', 'Phantom Read', 'Standard Implementation'],
      rows: [
        ['Read Uncommitted', 'Allowed', 'Allowed', 'Allowed', 'No shared read locks taken'],
        ['Read Committed', 'Prevented', 'Allowed', 'Allowed', 'Short-lived read locks or statement-level MVCC'],
        ['Repeatable Read', 'Prevented', 'Prevented', 'Allowed*', 'Transaction-level MVCC (InnoDB blocks phantoms via Next-Key locks)'],
        ['Serializable', 'Prevented', 'Prevented', 'Prevented', 'Strict 2-Phase Locking (2PL) or Serializable Snapshot Isolation']
      ]
    }),
    key_rules_json: JSON.stringify([
      'Dirty Read: Reading uncommitted data from an in-flight transaction.',
      'Non-repeatable Read: A row\'s values change between two reads in the same transaction.',
      'Phantom Read: New rows appear in a range query between two reads in the same transaction.',
      'Postgres and MySQL default to Read Committed and Repeatable Read respectively.'
    ])
  },
  {
    id: 'cs-sheet-003',
    subject: 'CN',
    title: 'TCP vs UDP Transport Layer Face-Off',
    summary: 'Direct contrast between connection-oriented reliable TCP and lightweight datagram UDP.',
    comparison_table_json: JSON.stringify({
      columns: ['Attribute', 'TCP (Transmission Control Protocol)', 'UDP (User Datagram Protocol)'],
      rows: [
        ['Connection Type', 'Connection-oriented (3-way handshake required)', 'Connectionless (Fire and forget)'],
        ['Reliability', 'Guaranteed delivery via ACKs & retransmission', 'No guarantee; packets can drop or arrive out of order'],
        ['Ordering', 'Strict in-order byte stream reconstruction', 'No ordering guarantees (datagrams independent)'],
        ['Header Size', '20 - 60 Bytes', '8 Bytes fixed'],
        ['Flow & Congestion Control', 'Yes (Sliding window, AIMD, Slow start)', 'None (transmits at full speed)'],
        ['Speed / Latency', 'Higher overhead & connection latency', 'Ultra-low latency; zero setup roundtrips'],
        ['Best Use Cases', 'HTTP/HTTPS, File Transfer (FTP), Email, SSH', 'Video streaming, VoIP, Gaming, DNS queries, QUIC']
      ]
    }),
    key_rules_json: JSON.stringify([
      'TCP guarantees delivery and ordering at the cost of latency and memory.',
      'UDP offers minimal 8-byte headers and instant transmission where dropped frames are preferable to delay.',
      'HTTP/3 (QUIC) builds reliability directly over UDP to eliminate TCP-level HoL blocking.'
    ])
  },
  {
    id: 'cs-sheet-004',
    subject: 'System Design',
    title: 'Caching Strategies: Cache-Aside vs Write-Through vs Write-Behind',
    summary: 'Trade-off comparison of caching patterns for read vs write intensive distributed applications.',
    comparison_table_json: JSON.stringify({
      columns: ['Pattern', 'Write Latency', 'Read Latency', 'Data Consistency', 'Risk of Data Loss'],
      rows: [
        ['Cache-Aside (Lazy)', 'Normal (writes directly to DB, evicts cache)', 'Fast on hit; slow on cold miss', 'Eventual (eviction avoids stale state)', 'Zero (DB is immediate source of truth)'],
        ['Write-Through', 'Slow (waits for both Cache & DB writes)', 'Always fast (cache is pre-warmed)', 'High consistency (cache matches DB)', 'Zero (synchronous DB persistence)'],
        ['Write-Behind (Write-Back)', 'Fastest (writes to memory cache immediately)', 'Always fast (cached in memory)', 'Eventual (batches writes asynchronously)', 'High (data lost if cache node crashes before sync)']
      ]
    }),
    key_rules_json: JSON.stringify([
      'Always invalidate (delete) cache keys on update rather than updating value to avoid race conditions.',
      'Set TTLs on all keys to prevent stale or orphaned data leaks.',
      'Use Write-Behind for extreme write volumes like analytics or video view counters.'
    ])
  },
  {
    id: 'cs-sheet-005',
    subject: 'OOPs',
    title: 'SOLID Principles 60-Second Mental Model',
    summary: 'The five core tenets of scalable object-oriented software engineering.',
    comparison_table_json: JSON.stringify({
      columns: ['Letter', 'Principle', '1-Sentence Rule', 'Canonical Fix'],
      rows: [
        ['S', 'Single Responsibility', 'A class should have only one reason to change.', 'Extract auxiliary responsibilities into separate helper classes.'],
        ['O', 'Open / Closed', 'Open for extension, closed for modification.', 'Use interfaces and polymorphism instead of switch/case statements.'],
        ['L', 'Liskov Substitution', 'Subtypes must be substitutable for base types.', 'Ensure derived classes never throw unexpected exceptions or violate base contracts.'],
        ['I', 'Interface Segregation', 'Do not force clients to depend on methods they do not use.', 'Decompose large, fat interfaces into smaller, focused role interfaces.'],
        ['D', 'Dependency Inversion', 'Depend on abstractions, not on concrete implementations.', 'Inject interfaces via constructor dependency injection.']
      ]
    }),
    key_rules_json: JSON.stringify([
      'Favor composition over inheritance (HAS-A over IS-A).',
      'Program to an interface, not an implementation.',
      'Keep interfaces small, cohesive, and client-centric.'
    ])
  }
]

export function seedCoreCsCatalog(db) {
  const insertCard = db.prepare(`
    INSERT OR IGNORE INTO core_cs_cards (
      id, subject, subtopic, title, question, answer_markdown,
      key_takeaway, difficulty, interview_frequency, code_snippet,
      code_language, diagram_ascii, is_custom
    ) VALUES (
      @id, @subject, @subtopic, @title, @question, @answer_markdown,
      @key_takeaway, @difficulty, @interview_frequency, @code_snippet,
      @code_language, @diagram_ascii, 0
    )
  `)

  const insertSheet = db.prepare(`
    INSERT OR IGNORE INTO core_cs_cheat_sheets (
      id, subject, title, summary, comparison_table_json, key_rules_json
    ) VALUES (
      @id, @subject, @title, @summary, @comparison_table_json, @key_rules_json
    )
  `)

  const transaction = db.transaction(() => {
    for (const card of curatedCards) {
      insertCard.run({
        ...card,
        code_snippet: card.code_snippet || null,
        code_language: card.code_language || null,
        diagram_ascii: card.diagram_ascii || null,
      })
    }

    for (const sheet of curatedCheatSheets) {
      insertSheet.run(sheet)
    }
  })

  transaction()
  console.log(`[Core CS Seeder] Seeded ${curatedCards.length} cards and ${curatedCheatSheets.length} cheat sheets.`)
}
