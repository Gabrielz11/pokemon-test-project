from locust import FastHttpUser, task

class Pokemon(FastHttpUser):  
    @task
    def list(self):        
        self.client.get("/pokemon")
