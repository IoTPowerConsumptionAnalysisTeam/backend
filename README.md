# How to use

## Install modules

```bash
npm install
```

## Connect to database

1. In the root directory, add a file named .env
2. Edit .env file to 

```YAML
DATABASE_URL = ${connect url from MongoDB Atlas database}
```

remember to remove the '<' and '>' in the url

## Start the server

```bash
npm start
```

## AI prediction
There are some packages that require installation
> remember to run under administer privilege
```bash
pip install -r requirements.txt
```