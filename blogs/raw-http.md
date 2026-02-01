---
title: "From Bytes to Bytes: Building a Raw HTTP Server in Rust"
date: "2026-02-01"
description: "A deep dive into implementing the HTTP protocol from scratch. We cover reading raw TCP streams, manual string parsing, and building a custom request parser in Rust without using any web frameworks."
tags: ["rust", "systems-programming", "http", "backend", "learning"]
categories: ["projects", "engineering"]
---

# Building an HTTP Server from Scratch in Rust: Understanding Raw TCP

> This project is an implementation of an HTTP server where I wrote code that listens to incoming byte streams on a TCP server port and converts those raw bytes into a processable string/struct of request.

## Introduction

Have you ever wondered what happens under the hood when your browser makes a request to a server? Most developers use high-level frameworks like Express, Actix, or Rocket that abstract away all the networking details. But understanding how HTTP actually works at the TCP level gives you a much deeper appreciation of web development.

In this blog, I'll walk you through building an HTTP server from scratch in Rust, using nothing but raw TCP sockets. No HTTP libraries, no web frameworks—just pure bytes and parsing.

## Project Structure

```
raw_http/
├── Cargo.toml
├── src/
│   ├── main.rs      # Entry point and TCP listener
│   ├── parser.rs    # HTTP request parsing
│   ├── router.rs    # Route handling logic
│   └── types.rs     # Data structures
└── files/           # Directory for file operations
```

## The Core Concept

HTTP is just text sent over TCP. When your browser sends a request, it's really just sending a formatted string like this:

```
GET /files HTTP/1.1
Host: localhost:8080
Content-Type: application/json

```

Our job is to:
1. Listen for TCP connections
2. Read the raw bytes from the stream
3. Parse those bytes into a structured request
4. Route the request to the appropriate handler
5. Send back a properly formatted HTTP response

## Dependencies

We're keeping dependencies minimal. Here's our `Cargo.toml`:

```toml
[package]
name = "raw_http"
version = "0.1.0"
edition = "2024"

[dependencies]
serde = {version = "1.0.228" , features = ["derive"]}
serde_json = "1.0.149"
```

We only use `serde` and `serde_json` for JSON body parsing—everything else is pure Rust standard library.

## Step 1: Defining Our Data Types

First, let's define the structures we'll use to represent HTTP requests. In `types.rs`:

```rust
use std::collections::HashMap;
use serde::{Serialize,Deserialize};

#[derive(Debug,Serialize,Deserialize)]
pub struct Request{
    pub method:String,
    pub path:String,
    pub version:String,
    pub headers:HashMap<String,String>,
    pub body:String
}
```

The `Request` struct captures everything we need from an HTTP request:
- **method**: GET, POST, PUT, DELETE, etc.
- **path**: The URL path like `/files` or `/create`
- **version**: HTTP version (usually `HTTP/1.1`)
- **headers**: Key-value pairs like `Content-Type: application/json`
- **body**: The request payload for POST/PUT requests

We also define structures for our API's JSON payloads:

```rust
#[derive(Debug,Serialize,Deserialize)]
pub struct FileCreateRequest{
    pub filename:String,
    pub filecontent:String
}

#[derive(Debug,Serialize,Deserialize)]
pub struct FileReadRequest{
    pub filename:String,
}
```

## Step 2: The TCP Listener

The heart of our server lives in `main.rs`. Let's start with the entry point:

```rust
mod router; mod parser; mod types;
use types::*; use router::*; use parser::*;
use std::{io::{Read, Write}, net::TcpListener};

fn main(){
    let listener = TcpListener::bind("127.0.0.1:8080").expect("Error connecting to the port");

    for stream in listener.incoming(){
        let mut stream = stream.unwrap();

        let request = read_http_request(&mut stream);
        let req = parse_request(&request);
        req_handler(&mut stream, &req);
    }
}
```

This is remarkably simple:
1. Bind to port 8080 on localhost
2. Wait for incoming connections
3. For each connection, read the raw HTTP request
4. Parse it into our `Request` struct
5. Handle the request and send a response

## Step 3: Reading Raw HTTP Requests

Here's where it gets interesting. HTTP requests are just bytes, and we need to read them carefully. The tricky part? We don't know how long the request is until we read the headers.

```rust
fn read_http_request(stream: &mut std::net::TcpStream) -> String {
    let mut buffer = [0; 1024];
    let mut data = Vec::new();

    loop {
        let n = stream.read(&mut buffer).unwrap();
        if n == 0 {
            break;
        }

        data.extend_from_slice(&buffer[..n]);

        if data.windows(4).any(|w| w == b"\r\n\r\n") {
            break;
        }
    }
```

We read bytes into a 1024-byte buffer in a loop. The key insight is that HTTP headers end with `\r\n\r\n` (a blank line). We use the `windows(4)` method to scan for this pattern.

But wait—what about the body? POST requests have a body, and its length is specified in the `Content-Length` header:

```rust
    let raw = String::from_utf8_lossy(&data).to_string();

    let content_length = raw
    .lines()
    .find(|l| l.to_lowercase().starts_with("content-length"))
    .and_then(|l| l.split(": ").nth(1))
    .and_then(|v| v.parse::<usize>().ok())
    .unwrap_or(0);

    let body_start = raw.find("\r\n\r\n").unwrap() + 4;
    let body_so_far = data.len() - body_start;

    let mut remaining = content_length.saturating_sub(body_so_far);

    while remaining > 0 {
        let n = stream.read(&mut buffer).unwrap();
        if n == 0 {
            break;
        }

        data.extend_from_slice(&buffer[..n]);
        remaining -= n;
    }

    String::from_utf8_lossy(&data).to_string()
}
```

We:
1. Convert bytes to a string to parse headers
2. Find the `Content-Length` header
3. Calculate how many body bytes we've already read
4. Continue reading until we have the full body

## Step 4: Parsing the HTTP Request

Now that we have the raw string, we need to parse it into our `Request` struct. In `parser.rs`:

```rust
use crate::types::*;
use std::collections::HashMap;

pub fn parse_request(raw_req:&str)->Request{
    let mut sections = raw_req.split("\r\n\r\n");

    let header_section = sections.next().unwrap();
    let body_section = sections.next().unwrap_or("");

    let mut lines = header_section.lines();

    let mut req_info = lines.next().unwrap().split_whitespace();

    let (method,path,version)=(req_info.next().unwrap(),req_info.next().unwrap(),req_info.next().unwrap());

    let headers = parse_headers(&mut lines);

    return Request { 
        method: method.to_string(), 
        path: path.to_string(), 
        version:version.to_string(), 
        headers, 
        body: body_section.to_string() 
    };    
}
```

The parsing logic follows the HTTP specification:
1. Split on `\r\n\r\n` to separate headers from body
2. The first line is always `METHOD PATH VERSION`
3. Subsequent lines are headers until the blank line

Header parsing is straightforward:

```rust
pub fn parse_headers(lines:&mut std::str::Lines)->HashMap<String,String>{
    let mut headers = HashMap::<String,String>::new();

    for line in lines{
        if let Some((key , val)) = line.split_once(": "){
            headers.insert(key.to_string(),val.to_string());
        }
    }

    return headers;
}
```

Each header line is `Key: Value`, so we split on `: ` and store in a HashMap.

## Step 5: Handling CORS

Before routing, we need to handle CORS (Cross-Origin Resource Sharing) for browser compatibility:

```rust
fn req_handler(stream: &mut std::net::TcpStream , req:&Request){
    if req.method == "OPTIONS" {
        let response = format!(
            "HTTP/1.1 204 No Content\r\n{}\r\n\r\n",
            cors_headers()
        );

        stream.write_all(response.as_bytes()).unwrap();
        stream.flush().unwrap();
        return;
    }

    let response = route_handler(&req.method,&req.path,&req.body);

    stream.write_all(response.as_bytes()).unwrap();
    stream.flush().unwrap();
}

fn cors_headers() -> String {
    [
        "Access-Control-Allow-Origin: http://localhost:5173",
        "Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers: Content-Type",
    ]
    .join("\r\n")
}
```

Browsers send `OPTIONS` requests before actual requests to check if CORS is allowed. We respond with the appropriate headers.

## Step 6: The Router

Finally, our router in `router.rs` handles different endpoints. This is a File API that supports creating, reading, updating, and listing files:

```rust
pub fn route_handler(method: &String , path:&String , body:&String)->String{
    let mut status = String::new();
    let mut response_body= String::from("");
    
    match (method.as_str(),path.as_str()) {
        ("GET","/")=>{
            status.push_str("200 OK");
            response_body.push_str("Hello welcome to File API");
        },
```

We use Rust's powerful pattern matching to route requests based on method + path combinations.

### Creating Files

```rust
        ("POST","/create")=>{
            let body_json:Result<FileCreateRequest,serde_json::Error> = serde_json::from_str(body);
            match body_json{
                Ok(json)=>{
                    let file = File::create(format!("./files/{}",json.filename));
                    match file{
                        Ok(mut file)=>{
                            let contentsize = file.write_all(json.filecontent.as_bytes());
                            match contentsize{
                                Ok(_)=>{
                                    status.push_str("200 OK");
                                    response_body.push_str(format!("File created with name : {}",json.filename).as_str());
                                },
                                Err(_)=>{
                                    status.push_str("500 Internal Server Error");
                                    response_body.push_str("Error Writing to the file.");
                                }
                            }
                        },
                        Err(_)=>{
                            status.push_str("500 Internal Server Error");
                            response_body.push_str("Error Creating the file.");
                        }
                    }
                }
                Err(_)=>{
                    status.push_str("500 Internal Server Error");
                    response_body.push_str("Wrong request format of body.");
                }
            }
        },
```

### Reading Files

```rust
        ("POST","/read")=>{
            let body_json:Result<FileReadRequest, serde_json::Error> = serde_json::from_str(&body);

            match body_json{
                Ok(json)=>{
                    let file = File::open(format!("./files/{}",json.filename));
                    match file{
                        Ok(mut file)=>{
                            let mut file_content = String::new();
                            let content = file.read_to_string(&mut file_content);
                            match content{
                                Ok(_)=>{
                                    status.push_str("200 OK");
                                    response_body.push_str(format!("Content of File:\r\n{}",&file_content).as_str());
                                },
                                Err(_)=>{
                                    status.push_str("500 Internal Server Error");
                                    response_body.push_str("Error reading the content of the file.")
                                }
                            }
                        }
                        Err(_)=>{
                            status.push_str("400 Bad Request");
                            response_body.push_str("File not found");
                        }
                    }
                },
                Err(_)=>{
                    status.push_str("500 Internal Server Error");
                    response_body.push_str("Wrong request format of body.");
                }
            }
        },
```

### Listing All Files

```rust
        ("GET","/files")=>{
            let mut file_names = Vec::new();
            let files = fs::read_dir("./files").unwrap();

            for file in files{
                let file = file.unwrap();
                if file.path().is_file(){
                    if let Some(file_name) = file.path().file_name().and_then(OsStr::to_str){
                        file_names.push(String::from(file_name));
                    }
                }
            }

            if file_names.len()>0{
                status.push_str("200 OK");
                response_body.push_str("All the files :");
                file_names.sort();
                for filename in file_names{
                    response_body.push_str(format!("\n{}",filename).as_str());
                }
            }else {
                status.push_str("200 OK");
                response_body.push_str("No files found");
            }
        }
```

### Building the HTTP Response

Every route handler builds a proper HTTP response:

```rust
    let response = format!(
        "HTTP/1.1 {}\r\nContent-Length: {}\r\nContent-Type: text/plain\r\nAccess-Control-Allow-Origin: http://localhost:5173\r\nAccess-Control-Allow-Methods: GET, POST, PUT, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\n\r\n{}",
        &status,&response_body.as_bytes().len(),&response_body
    );

    return response;
}
```

The response follows HTTP format:
1. Status line: `HTTP/1.1 200 OK`
2. Headers: `Content-Length`, `Content-Type`, CORS headers
3. Blank line (`\r\n\r\n`)
4. Body

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Welcome message |
| POST | `/create` | Create a new file |
| POST | `/read` | Read file contents |
| PUT | `/update` | Update a file |
| GET | `/files` | List all files |

### Example Usage

**Create a file:**
```bash
curl -X POST http://localhost:8080/create \
  -H "Content-Type: application/json" \
  -d '{"filename": "hello.txt", "filecontent": "Hello, World!"}'
```

**Read a file:**
```bash
curl -X POST http://localhost:8080/read \
  -H "Content-Type: application/json" \
  -d '{"filename": "hello.txt"}'
```

**List all files:**
```bash
curl http://localhost:8080/files
```

## Key Takeaways

1. **HTTP is just formatted text over TCP** - There's no magic. It's bytes with a specific format.

2. **Headers and body are separated by `\r\n\r\n`** - This is the key pattern to detect when headers end.

3. **Content-Length matters** - Without it, you don't know how much body data to read.

4. **Pattern matching is powerful** - Rust's `match` on tuples makes routing elegant.

5. **Error handling is crucial** - Every I/O operation can fail, and Rust forces you to handle it.

## What's Missing (For Production)

This is an educational server. For production use, you'd need:

- **Multithreading/async** - Currently handles one request at a time
- **Keep-alive connections** - We close after each request
- **Chunked transfer encoding** - For streaming responses
- **Better error handling** - More graceful failure modes
- **Security** - Input validation, path traversal protection
- **HTTPS** - TLS encryption

## Conclusion

Building an HTTP server from scratch teaches you what frameworks do for you—and why they exist. Understanding the raw TCP level makes you a better developer, even if you never write production code at this level.

The complete source code is available in this repository. Feel free to experiment and extend it!

---

*Built with Rust and curiosity.*
