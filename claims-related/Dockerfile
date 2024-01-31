FROM public.ecr.aws/ews-network/python:3.10 as builder
ENV LC_ALL='en_US.UTF-8'

RUN yum -y install shadow-utils && \
    useradd -m app

ENV PIPENV_VENV_IN_PROJECT=1

WORKDIR /home/app/

COPY Pipfile .
COPY Pipfile.lock .
RUN pip install -q --upgrade pip
RUN pip install pipenv
RUN pipenv install --ignore-pipfile

FROM public.ecr.aws/ews-network/python:3.10 as runtime

RUN yum -y install shadow-utils && \
    yum -y install jq && \
    useradd -m app

RUN mkdir -p /home/app/{single_source,.venv,data,measures}
COPY --from=builder /home/app/.venv/ /home/app/.venv/
COPY single_source/ /home/app/single_source/

WORKDIR /home/app/

USER app