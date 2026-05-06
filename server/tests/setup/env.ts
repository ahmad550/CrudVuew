// Sets MONGO_URI for test workers. The workflow env var overrides this at the step level.
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/crudvuew_test'
