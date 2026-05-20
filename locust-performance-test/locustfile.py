from locust import HttpUser, task

class Pokemon(HttpUser):  
    @task
    def list(self):        
        self.client.get("/pokemon")