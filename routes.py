from flask import Blueprint, render_template, request, flash, redirect, url_for, jsonify
from flask_login import login_required, current_user
from datetime import datetime, date, time
from models import User, MenuItem, Table, Reservation, Order, OrderItem
from app import db
import uuid

# Create main routes blueprint
main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Home page - redirect to dashboard if logged in, else login"""
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    return redirect(url_for('auth.login'))

@main_bp.route('/dashboard')
@login_required
def dashboard():
    """Main dashboard with role-based navigation"""
    # Get dashboard statistics
    stats = {}
    
    if current_user.is_admin():
        stats['total_menu_items'] = MenuItem.query.count()
        stats['total_tables'] = Table.query.count()
        stats['total_staff'] = User.query.filter_by(role='staff').count()
    
    stats['today_reservations'] = Reservation.query.filter_by(reservation_date=date.today()).count()
    stats['active_orders'] = Order.query.filter(Order.status.in_(['pending', 'preparing', 'ready'])).count()
    
    return render_template('dashboard.html', stats=stats)

# Menu Management Routes
@main_bp.route('/menu')
@login_required
def menu():
    """Display menu items"""
    items = MenuItem.query.order_by(MenuItem.category, MenuItem.name).all()
    return render_template('menu.html', items=items)

@main_bp.route('/menu/add', methods=['GET', 'POST'])
@login_required
def add_menu_item():
    """Add new menu item (Admin only)"""
    if not current_user.is_admin():
        flash('Admin access required.', 'error')
        return redirect(url_for('main.menu'))
    
    if request.method == 'POST':
        name = request.form.get('name')
        description = request.form.get('description')
        price = request.form.get('price')
        category = request.form.get('category')
        
        if not all([name, price, category]):
            flash('Please fill in all required fields.', 'error')
            return render_template('menu_form.html')
        
        try:
            price = float(price)
            if price <= 0:
                raise ValueError("Price must be positive")
        except ValueError:
            flash('Please enter a valid price.', 'error')
            return render_template('menu_form.html')
        
        menu_item = MenuItem(
            name=name,
            description=description,
            price=price,
            category=category
        )
        
        try:
            db.session.add(menu_item)
            db.session.commit()
            flash('Menu item added successfully!', 'success')
            return redirect(url_for('main.menu'))
        except Exception as e:
            db.session.rollback()
            flash('Error adding menu item.', 'error')
    
    return render_template('menu_form.html')

@main_bp.route('/menu/edit/<int:item_id>', methods=['GET', 'POST'])
@login_required
def edit_menu_item(item_id):
    """Edit menu item (Admin only)"""
    if not current_user.is_admin():
        flash('Admin access required.', 'error')
        return redirect(url_for('main.menu'))
    
    item = MenuItem.query.get_or_404(item_id)
    
    if request.method == 'POST':
        item.name = request.form.get('name')
        item.description = request.form.get('description')
        item.category = request.form.get('category')
        item.available = 'available' in request.form
        
        try:
            price = float(request.form.get('price'))
            if price <= 0:
                raise ValueError("Price must be positive")
            item.price = price
        except ValueError:
            flash('Please enter a valid price.', 'error')
            return render_template('menu_form.html', item=item)
        
        try:
            db.session.commit()
            flash('Menu item updated successfully!', 'success')
            return redirect(url_for('main.menu'))
        except Exception as e:
            db.session.rollback()
            flash('Error updating menu item.', 'error')
    
    return render_template('menu_form.html', item=item)

@main_bp.route('/menu/delete/<int:item_id>')
@login_required
def delete_menu_item(item_id):
    """Delete menu item (Admin only)"""
    if not current_user.is_admin():
        flash('Admin access required.', 'error')
        return redirect(url_for('main.menu'))
    
    item = MenuItem.query.get_or_404(item_id)
    
    try:
        db.session.delete(item)
        db.session.commit()
        flash('Menu item deleted successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Error deleting menu item.', 'error')
    
    return redirect(url_for('main.menu'))

# Table Management Routes
@main_bp.route('/tables')
@login_required
def tables():
    """Display restaurant tables"""
    tables = Table.query.order_by(Table.number).all()
    return render_template('tables.html', tables=tables)

@main_bp.route('/tables/add', methods=['GET', 'POST'])
@login_required
def add_table():
    """Add new table (Admin only)"""
    if not current_user.is_admin():
        flash('Admin access required.', 'error')
        return redirect(url_for('main.tables'))
    
    if request.method == 'POST':
        number = request.form.get('number')
        capacity = request.form.get('capacity')
        
        if not all([number, capacity]):
            flash('Please fill in all fields.', 'error')
            return render_template('table_form.html')
        
        try:
            number = int(number)
            capacity = int(capacity)
            if number <= 0 or capacity <= 0:
                raise ValueError("Numbers must be positive")
        except ValueError:
            flash('Please enter valid numbers.', 'error')
            return render_template('table_form.html')
        
        # Check if table number already exists
        if Table.query.filter_by(number=number).first():
            flash('Table number already exists.', 'error')
            return render_template('table_form.html')
        
        table = Table(number=number, capacity=capacity)
        
        try:
            db.session.add(table)
            db.session.commit()
            flash('Table added successfully!', 'success')
            return redirect(url_for('main.tables'))
        except Exception as e:
            db.session.rollback()
            flash('Error adding table.', 'error')
    
    return render_template('table_form.html')

@main_bp.route('/tables/edit/<int:table_id>', methods=['GET', 'POST'])
@login_required
def edit_table(table_id):
    """Edit table (Admin only)"""
    if not current_user.is_admin():
        flash('Admin access required.', 'error')
        return redirect(url_for('main.tables'))
    
    table = Table.query.get_or_404(table_id)
    
    if request.method == 'POST':
        try:
            number = int(request.form.get('number'))
            capacity = int(request.form.get('capacity'))
            status = request.form.get('status')
            
            if number <= 0 or capacity <= 0:
                raise ValueError("Numbers must be positive")
            
            # Check if number conflicts with another table
            existing = Table.query.filter_by(number=number).first()
            if existing and existing.id != table.id:
                flash('Table number already exists.', 'error')
                return render_template('table_form.html', table=table)
            
            table.number = number
            table.capacity = capacity
            table.status = status
            
            db.session.commit()
            flash('Table updated successfully!', 'success')
            return redirect(url_for('main.tables'))
        except ValueError:
            flash('Please enter valid numbers.', 'error')
        except Exception as e:
            db.session.rollback()
            flash('Error updating table.', 'error')
    
    return render_template('table_form.html', table=table)

# Reservation Management Routes
@main_bp.route('/reservations')
@login_required
def reservations():
    """Display reservations"""
    reservations = Reservation.query.order_by(Reservation.reservation_date.desc(), 
                                               Reservation.reservation_time.desc()).all()
    return render_template('reservations.html', reservations=reservations)

@main_bp.route('/reservations/add', methods=['GET', 'POST'])
@login_required
def add_reservation():
    """Add new reservation"""
    if request.method == 'POST':
        customer_name = request.form.get('customer_name')
        customer_email = request.form.get('customer_email')
        customer_phone = request.form.get('customer_phone')
        party_size = request.form.get('party_size')
        reservation_date = request.form.get('reservation_date')
        reservation_time = request.form.get('reservation_time')
        table_id = request.form.get('table_id')
        special_requests = request.form.get('special_requests')
        
        if not all([customer_name, party_size, reservation_date, reservation_time, table_id]):
            flash('Please fill in all required fields.', 'error')
            tables = Table.query.filter_by(status='available').order_by(Table.number).all()
            return render_template('reservation_form.html', tables=tables)
        
        try:
            party_size = int(party_size)
            table_id = int(table_id)
            res_date = datetime.strptime(reservation_date, '%Y-%m-%d').date()
            res_time = datetime.strptime(reservation_time, '%H:%M').time()
            
            if party_size <= 0:
                raise ValueError("Party size must be positive")
            if res_date < date.today():
                raise ValueError("Reservation date cannot be in the past")
        except ValueError as e:
            flash('Please enter valid date and time.', 'error')
            tables = Table.query.filter_by(status='available').order_by(Table.number).all()
            return render_template('reservation_form.html', tables=tables)
        
        # Check table availability
        table = Table.query.get_or_404(table_id)
        if party_size > table.capacity:
            flash(f'Party size exceeds table capacity ({table.capacity}).', 'error')
            tables = Table.query.filter_by(status='available').order_by(Table.number).all()
            return render_template('reservation_form.html', tables=tables)
        
        reservation = Reservation(
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone,
            party_size=party_size,
            reservation_date=res_date,
            reservation_time=res_time,
            table_id=table_id,
            special_requests=special_requests
        )
        
        try:
            db.session.add(reservation)
            db.session.commit()
            flash('Reservation created successfully!', 'success')
            return redirect(url_for('main.reservations'))
        except Exception as e:
            db.session.rollback()
            flash('Error creating reservation.', 'error')
    
    tables = Table.query.filter_by(status='available').order_by(Table.number).all()
    return render_template('reservation_form.html', tables=tables)

# Order Management Routes
@main_bp.route('/orders')
@login_required
def orders():
    """Display orders"""
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return render_template('orders.html', orders=orders)

@main_bp.route('/orders/add', methods=['GET', 'POST'])
@login_required
def add_order():
    """Add new order"""
    if request.method == 'POST':
        table_id = request.form.get('table_id')
        notes = request.form.get('notes')
        
        if not table_id:
            flash('Please select a table.', 'error')
            tables = Table.query.filter(Table.status.in_(['available', 'occupied'])).order_by(Table.number).all()
            menu_items = MenuItem.query.filter_by(available=True).order_by(MenuItem.category, MenuItem.name).all()
            return render_template('order_form.html', tables=tables, menu_items=menu_items)
        
        try:
            table_id = int(table_id)
        except ValueError:
            flash('Please select a valid table.', 'error')
            tables = Table.query.filter(Table.status.in_(['available', 'occupied'])).order_by(Table.number).all()
            menu_items = MenuItem.query.filter_by(available=True).order_by(MenuItem.category, MenuItem.name).all()
            return render_template('order_form.html', tables=tables, menu_items=menu_items)
        
        # Generate unique order number
        order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        order = Order(
            order_number=order_number,
            table_id=table_id,
            staff_id=current_user.id,
            notes=notes
        )
        
        try:
            db.session.add(order)
            db.session.commit()
            
            # Update table status to occupied
            table = Table.query.get(table_id)
            table.status = 'occupied'
            db.session.commit()
            
            flash('Order created successfully!', 'success')
            return redirect(url_for('main.edit_order', order_id=order.id))
        except Exception as e:
            db.session.rollback()
            flash('Error creating order.', 'error')
    
    tables = Table.query.filter(Table.status.in_(['available', 'occupied'])).order_by(Table.number).all()
    menu_items = MenuItem.query.filter_by(available=True).order_by(MenuItem.category, MenuItem.name).all()
    return render_template('order_form.html', tables=tables, menu_items=menu_items)

@main_bp.route('/orders/edit/<int:order_id>', methods=['GET', 'POST'])
@login_required
def edit_order(order_id):
    """Edit order and manage order items"""
    order = Order.query.get_or_404(order_id)
    
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'add_item':
            menu_item_id = request.form.get('menu_item_id')
            quantity = request.form.get('quantity')
            special_instructions = request.form.get('special_instructions')
            
            try:
                menu_item_id = int(menu_item_id)
                quantity = int(quantity)
                if quantity <= 0:
                    raise ValueError("Quantity must be positive")
            except ValueError:
                flash('Please enter valid item and quantity.', 'error')
                return redirect(url_for('main.edit_order', order_id=order_id))
            
            menu_item = MenuItem.query.get_or_404(menu_item_id)
            
            order_item = OrderItem(
                order_id=order.id,
                menu_item_id=menu_item_id,
                quantity=quantity,
                unit_price=menu_item.price,
                special_instructions=special_instructions
            )
            order_item.subtotal = order_item.unit_price * order_item.quantity
            
            try:
                db.session.add(order_item)
                order.calculate_total()
                db.session.commit()
                flash('Item added to order!', 'success')
            except Exception as e:
                db.session.rollback()
                flash('Error adding item to order.', 'error')
        
        elif action == 'update_status':
            new_status = request.form.get('status')
            if new_status in ['pending', 'preparing', 'ready', 'served', 'paid']:
                order.status = new_status
                
                # If order is paid, make table available
                if new_status == 'paid':
                    order.table.status = 'available'
                
                try:
                    db.session.commit()
                    flash('Order status updated!', 'success')
                except Exception as e:
                    db.session.rollback()
                    flash('Error updating order status.', 'error')
        
        return redirect(url_for('main.edit_order', order_id=order_id))
    
    menu_items = MenuItem.query.filter_by(available=True).order_by(MenuItem.category, MenuItem.name).all()
    return render_template('order_form.html', order=order, menu_items=menu_items, edit_mode=True)

@main_bp.route('/orders/remove_item/<int:item_id>')
@login_required
def remove_order_item(item_id):
    """Remove item from order"""
    order_item = OrderItem.query.get_or_404(item_id)
    order = order_item.order
    
    try:
        db.session.delete(order_item)
        order.calculate_total()
        db.session.commit()
        flash('Item removed from order!', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Error removing item from order.', 'error')
    
    return redirect(url_for('main.edit_order', order_id=order.id))
