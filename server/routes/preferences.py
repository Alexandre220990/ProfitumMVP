from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime
import os

preferences = Blueprint('preferences', __name__)

def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        host=os.getenv('DB_HOST'),
        port=os.getenv('DB_PORT')
    )

@preferences.route('/api/preferences', methods=['GET'])
@jwt_required()
def get_preferences():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        user_id = get_jwt_identity()
        
        cur.execute("""
            SELECT * FROM user_preferences
            WHERE user_id = %s
        """, (user_id,))
        
        preferences = cur.fetchone()
        
        if not preferences:
            return jsonify({
                'success': False,
                'error': 'Préférences non trouvées'
            }), 404
            
        return jsonify({
            'success': True,
            'data': preferences
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
        
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

@preferences.route('/api/preferences', methods=['POST'])
@jwt_required()
def create_preferences():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Vérifier si les préférences existent déjà
        cur.execute("""
            SELECT id FROM user_preferences
            WHERE user_id = %s
        """, (user_id,))
        
        if cur.fetchone():
            return jsonify({
                'success': False,
                'error': 'Les préférences existent déjà'
            }), 400
        
        # Créer les préférences
        cur.execute("""
            INSERT INTO user_preferences (
                user_id, dashboard_visited,
                tutorial_completed, ui_settings,
                notifications_settings, last_viewed_request
            ) VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            user_id,
            data.get('dashboard_visited', False),
            json.dumps(data.get('tutorial_completed', {})),
            json.dumps(data.get('ui_settings', {})),
            json.dumps(data.get('notifications_settings', {})),
            data.get('last_viewed_request')
        ))
        
        preferences = cur.fetchone()
        conn.commit()
        
        return jsonify({
            'success': True,
            'data': preferences
        })
        
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
        
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

@preferences.route('/api/preferences', methods=['PUT'])
@jwt_required()
def update_preferences():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Mettre à jour les préférences
        update_fields = []
        update_values = []
        
        if 'dashboard_visited' in data:
            update_fields.append('dashboard_visited = %s')
            update_values.append(data['dashboard_visited'])
            
        if 'tutorial_completed' in data:
            update_fields.append('tutorial_completed = %s')
            update_values.append(json.dumps(data['tutorial_completed']))
            
        if 'ui_settings' in data:
            update_fields.append('ui_settings = %s')
            update_values.append(json.dumps(data['ui_settings']))
            
        if 'notifications_settings' in data:
            update_fields.append('notifications_settings = %s')
            update_values.append(json.dumps(data['notifications_settings']))
            
        if 'last_viewed_request' in data:
            update_fields.append('last_viewed_request = %s')
            update_values.append(data['last_viewed_request'])
            
        if not update_fields:
            return jsonify({
                'success': False,
                'error': 'Aucun champ à mettre à jour'
            }), 400
            
        update_values.append(user_id)
        
        query = f"""
            UPDATE user_preferences
            SET {', '.join(update_fields)}
            WHERE user_id = %s
            RETURNING *
        """
        
        cur.execute(query, update_values)
        preferences = cur.fetchone()
        
        if not preferences:
            return jsonify({
                'success': False,
                'error': 'Préférences non trouvées'
            }), 404
            
        conn.commit()
        
        return jsonify({
            'success': True,
            'data': preferences
        })
        
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
        
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close() 