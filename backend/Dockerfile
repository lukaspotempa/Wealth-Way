FROM python:3.14

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY ./app /code/backend/app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]