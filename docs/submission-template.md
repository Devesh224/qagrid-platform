# QAGrid assignment report template

Replace bracketed placeholders only after you have real evidence. The assignment submission document should contain the sections below. Do not submit this template unchanged.

## Member details

Student ID: [fill]
Student name: [fill]
Other group members, if applicable: [fill]

## Application description

QAGrid manages shared QA test environments and exclusive reservation slots. The two implemented services are Environment Registry and Reservation Scheduler. Test Execution and Notification are architectural extensions only.

## System operations and service mapping

Copy the operation matrix from docs/system-design.md and explain one command and one query from each implemented service in your own words.

## Architecture and collaboration

Insert the architecture diagram from docs/system-design.md or render it as an image. Explain that Scheduler validates environment state through Registry's HTTP API and stores reservations in its own PostgreSQL database. Explain why the database exclusion constraint protects simultaneous bookings.

## API contracts and database schema

Summarize the route tables and database schema from docs/system-design.md. Include the half-open interval rule and status/error behavior.

## Project structure and technology

Describe the independent environment-registry and reservation-scheduler repositories. List Python 3.12, FastAPI, Uvicorn, SQLAlchemy, PostgreSQL, HTTPX, Pytest, Docker, Kubernetes, and Minikube. Provide the actual GitHub URLs:
- Registry: [actual GitHub URL]
- Scheduler: [actual GitHub URL]

## Implementation steps and execution instructions

Use the commands from README.md. Add the actual versions printed on the deployment PC and mention any changes you made. Do not paste commands that were not run as though they were executed.

## Tests and service call snapshots

Insert actual Postman screenshots and responses for environment creation, health change, reservation creation, overlap rejection, adjacent acceptance, cancellation and rebooking, invalid time, and Registry unavailable if demonstrated. Include the actual unit and end-to-end test output. Explain any failing test and its resolution.

## Docker and Kubernetes deployment

Insert actual docker compose ps output, Kubernetes Pods/Deployments/Services/PVC output, and Dashboard screenshots. Record observed replica counts and Pod status. Explain how Scheduler reaches Registry through the Kubernetes Service and how each API reaches its own database. Include actual issues and fixes, if any.

## Demonstration video

Video filename or link: [fill after recording]
Briefly describe what the recording shows: [fill]

## Limitations and future work

The local demo uses two single-replica PostgreSQL databases. Registry status changes do not automatically cancel existing reservations. Authentication, database high availability, automated migrations, and real Notification/Test Execution services are future improvements.

## Submission checklist

- [ ] Member details included
- [ ] Two separate GitHub repository links verified
- [ ] Design, API contracts, database schema, and diagram included
- [ ] Postman screenshots from real calls included
- [ ] Docker and Kubernetes evidence included
- [ ] Dashboard analysis included
- [ ] Demo video included and playable
- [ ] One final ZIP named with student ID and application name
