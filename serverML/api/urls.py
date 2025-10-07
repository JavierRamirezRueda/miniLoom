from . import views
from django.urls import path
 
urlpatterns = [
    path('prompts/', views.handle_prompts),
    path('prompts/<int:pk>/', views.handle_prompts_by_id),
    path('branches/', views.handle_branches),
    path('branches/<int:pk>/', views.handle_branches_by_id),
    path('blocks/', views.handle_blocks),
    path('blocks/<int:pk>/', views.handle_blocks_by_id),
    path('generate/', views.generate),
    path('discriminate/', views.discriminate),
]
