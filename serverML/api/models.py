from django.db import models
 
class Prompt(models.Model):
    prompt_title = models.TextField(blank = True)
    text = models.TextField(blank = True)
    next = models.ForeignKey('self', on_delete = models.DO_NOTHING, null = True)

class Branch(models.Model):
    prompt = models.ForeignKey(Prompt, on_delete = models.DO_NOTHING)

class Block(models.Model):
    branch = models.ForeignKey(Branch, on_delete = models.DO_NOTHING)
    text = models.TextField(blank = True)
    next = models.ForeignKey('self', on_delete = models.DO_NOTHING, null = True)
