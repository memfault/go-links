FROM python:3.11.14-slim-trixie

ENV CLOUDSDK_PYTHON=/usr/local/bin/python
RUN apt-get update && apt-get install curl gnupg2 libpq-dev gcc -y

WORKDIR /usr/src/app
COPY server server

# from https://cloud.google.com/sdk/docs/install#deb
RUN curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] http://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    apt-get update -y && \
    apt-get install google-cloud-sdk -y
RUN pip install -r server/src/requirements.txt

CMD [ "./server/scripts/run.sh" ]
