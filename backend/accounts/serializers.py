from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'organization_type')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)
    organization_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role', 'organization_type')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password'],
            role=validated_data.get('role', 'customer'),
            organization_type=validated_data.get('organization_type')
        )
        return user

class LoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        return token
